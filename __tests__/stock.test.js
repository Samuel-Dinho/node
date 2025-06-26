// __tests__/stock.test.js
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// Função auxiliar para criar um pequeno atraso
const delay = ms => new Promise(res => setTimeout(res, ms));

describe('Stock API', () => {
    let adminToken;
    let userToken;
    let testProductId;
    let testUserId; // Para o ID do usuário comum

    beforeAll(async () => {
        // Limpa o banco de dados antes de todos os testes
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        await pool.execute('DROP TABLE IF EXISTS stock_movements');
        await pool.execute('DROP TABLE IF EXISTS products');
        await pool.execute('DROP TABLE IF EXISTS users');
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        // Recria as tabelas na ordem correta de dependência
        await User.createTable();
        await Product.createTable();
        await StockMovement.createTable();

        // 1. Criar usuário admin
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'admin_stock', password: 'password123', role: 'admin' });
        const adminLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin_stock', password: 'password123' });
        adminToken = adminLoginRes.body.token;

        // 2. Criar usuário comum
        const userRegisterRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'user_stock', password: 'userpassword', role: 'user' });
        testUserId = userRegisterRes.body.user.id; // Captura o ID do usuário comum
        const userLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'user_stock', password: 'userpassword' });
        userToken = userLoginRes.body.token;

        // 3. Criar um produto para os testes de estoque
        const createProductRes = await request(app)
            .post('/api/products') // Rota de criação de produto
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Produto Teste Estoque', quantity: 10, price: 50.00, category: 'Geral' });

        expect(createProductRes.statusCode).toEqual(201); // Verificação importante
        expect(createProductRes.body.product).toHaveProperty('id'); // O ID está em .product.id
        testProductId = createProductRes.body.product.id; // Correção: pegar o ID de .product.id

        // 4. Criar movimentos de estoque para o histórico inicial
        // ENTRADA primeiro para que a SAÍDA seja o movimento MAIS RECENTE para a ordenação DESC
        await request(app)
            .post('/api/stock/entry') // Usar /entry
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ productId: testProductId, quantity: 10 });

        // Adiciona um pequeno atraso para garantir timestamps diferentes
        await delay(100); // Atraso de 100ms

        await request(app)
            .post('/api/stock/exit') // Usar /exit
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ productId: testProductId, quantity: 3 }); // Movimento mais recente
    });

    afterAll(async () => {
        await pool.end(); // Fechar a conexão do pool de banco de dados
    });

    // Teste: Registrar Entrada (ADMIN)
    it('should allow an admin to register a stock entry', async () => {
        const initialProduct = await Product.findById(testProductId);
        const initialQuantity = initialProduct.quantity;

        const res = await request(app)
            .post('/api/stock/entry') // Usar /entry
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ productId: testProductId, quantity: 5 });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Entrada de 5 unidades para o produto "Produto Teste Estoque" registrada.');

        const updatedProduct = await Product.findById(testProductId);
        expect(updatedProduct.quantity).toEqual(initialQuantity + 5);
    });

    // Teste: Não registrar Entrada (USUÁRIO COMUM)
    it('should not allow a regular user to register a stock entry', async () => {
        const res = await request(app)
            .post('/api/stock/entry') // Usar /entry
            .set('Authorization', `Bearer ${userToken}`)
            .send({ productId: testProductId, quantity: 2 });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });

    // Teste: Registrar Saída (ADMIN)
    it('should allow an admin to register a stock exit', async () => {
        const initialProduct = await Product.findById(testProductId);
        const initialQuantity = initialProduct.quantity;

        const res = await request(app)
            .post('/api/stock/exit') // Usar /exit
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ productId: testProductId, quantity: 2 });
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Saída de 2 unidades para o produto "Produto Teste Estoque" registrada.');

        const updatedProduct = await Product.findById(testProductId);
        expect(updatedProduct.quantity).toEqual(initialQuantity - 2);
    });

    // Teste: Não registrar Saída (USUÁRIO COMUM)
    it('should not allow a regular user to register a stock exit', async () => {
        const res = await request(app)
            .post('/api/stock/exit') // Usar /exit
            .set('Authorization', `Bearer ${userToken}`)
            .send({ productId: testProductId, quantity: 1 });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });

    // Teste: Saída com estoque insuficiente (ADMIN)
    it('should not allow a stock exit with insufficient quantity', async () => {
        const product = await Product.findById(testProductId);
        const res = await request(app)
            .post('/api/stock/exit') // Usar /exit
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ productId: testProductId, quantity: product.quantity + 1 }); // Tentar remover mais do que o estoque atual
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message', 'Quantidade em estoque insuficiente para esta saída.');
    });

    // TESTES DE QUANTIDADE ATUAL DO PRODUTO (GET /api/stock/:productId)
    it('should get product current quantity by ID (admin)', async () => {
        const res = await request(app)
            .get(`/api/stock/${testProductId}`) // Rota direta para quantidade
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('productId', testProductId);
        expect(res.body).toHaveProperty('productName', 'Produto Teste Estoque');
        expect(res.body).toHaveProperty('currentQuantity');
        expect(typeof res.body.currentQuantity).toBe('number'); // Garante que é um número
    });

    it('should allow a regular user to get product current quantity by ID', async () => {
        const res = await request(app)
            .get(`/api/stock/${testProductId}`) // Rota direta para quantidade
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('productId', testProductId);
        expect(res.body).toHaveProperty('productName', 'Produto Teste Estoque');
        expect(res.body).toHaveProperty('currentQuantity');
    });

    it('should return 404 for non-existent product when getting quantity', async () => {
        const nonExistentProductId = 99999;
        const res = await request(app)
            .get(`/api/stock/${nonExistentProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('message', 'Produto não encontrado.');
    });


    // TESTES DE HISTÓRICO DE MOVIMENTOS (GET /api/stock/history/:productId)
    it('should allow an admin to get product movement history', async () => {
        const product = await Product.findById(testProductId); // Pega o produto atualizado
        const res = await request(app)
            .get(`/api/stock/history/${testProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('productName', 'Produto Teste Estoque');
        expect(res.body).toHaveProperty('currentQuantity', product.quantity); // Agora compara com a quantidade atual real
        expect(Array.isArray(res.body.history)).toBeTruthy();
        expect(res.body.history.length).toBeGreaterThanOrEqual(2); // Pelo menos os movimentos iniciais
        expect(res.body.history[0].type).toEqual('saida'); // Movimento mais recente (da inicialização)
        expect(res.body.history[1].type).toEqual('entrada'); // Segundo movimento mais recente (da inicialização)
    });

    it('should allow a regular user to get product movement history', async () => {
        const product = await Product.findById(testProductId); // Pega o produto atualizado
        const res = await request(app)
            .get(`/api/stock/history/${testProductId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('productName', 'Produto Teste Estoque');
        expect(res.body).toHaveProperty('currentQuantity', product.quantity);
        expect(Array.isArray(res.body.history)).toBeTruthy();
        expect(res.body.history.length).toBeGreaterThanOrEqual(2);
        expect(res.body.history[0].type).toEqual('saida');
        expect(res.body.history[1].type).toEqual('entrada');
    });

    it('should return 404 for non-existent product when getting history', async () => {
        const nonExistentProductId = 99999;
        const res = await request(app)
            .get(`/api/stock/history/${nonExistentProductId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('message', 'Produto não encontrado.');
    });
});