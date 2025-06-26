
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

describe('Report API', () => {
    let adminToken;
    let userToken;
    let productAId, productBId, productCId;

    beforeAll(async () => {

        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        await pool.execute('DROP TABLE IF EXISTS stock_movements');
        await pool.execute('DROP TABLE IF EXISTS products');
        await pool.execute('DROP TABLE IF EXISTS users');
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        await User.createTable();
        await Product.createTable();
        await StockMovement.createTable();


        await request(app).post('/api/auth/register').send({ username: 'admin_reports', password: 'password123', role: 'admin' });
        const adminLoginRes = await request(app).post('/api/auth/login').send({ username: 'admin_reports', password: 'password123' });
        adminToken = adminLoginRes.body.token;


        await request(app).post('/api/auth/register').send({ username: 'user_reports', password: 'password123', role: 'user' });
        const userLoginRes = await request(app).post('/api/auth/login').send({ username: 'user_reports', password: 'password123' });
        userToken = userLoginRes.body.token;


        const resA = await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Produto A', quantity: 10, price: 10.00, category: 'Test' });
        productAId = resA.body.product.id;
        const resB = await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Produto B', quantity: 5, price: 20.00, category: 'Test' });
        productBId = resB.body.product.id;
        const resC = await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Produto C', quantity: 2, price: 30.00, category: 'Test' });
        productCId = resC.body.product.id;


        await request(app).post('/api/stock/exit').set('Authorization', `Bearer ${adminToken}`).send({ productId: productAId, quantity: 3 });
        await request(app).post('/api/stock/exit').set('Authorization', `Bearer ${adminToken}`).send({ productId: productBId, quantity: 2 });
        await request(app).post('/api/stock/exit').set('Authorization', `Bearer ${adminToken}`).send({ productId: productAId, quantity: 1 });
        await request(app).post('/api/stock/exit').set('Authorization', `Bearer ${adminToken}`).send({ productId: productCId, quantity: 1 });
    });

    afterAll(async () => {
        await pool.end();
    });


    it('should allow an admin to get the most sold products report', async () => {
        const res = await request(app)
            .get('/api/reports/most-sold')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Relatório de Produtos Mais Vendidos');
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);

        expect(res.body.data[0].name).toEqual('Produto A');
        expect(res.body.data[0].total_sold_quantity).toEqual(4);
        expect(res.body.data[1].name).toEqual('Produto B');
        expect(res.body.data[1].total_sold_quantity).toEqual(2);
    });


    it('should not allow a regular user to get the most sold products report', async () => {
        const res = await request(app)
            .get('/api/reports/most-sold')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });


    it('should allow an admin to get the low stock products report with default threshold', async () => {
        const res = await request(app)
            .get('/api/reports/low-stock')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Relatório de Produtos com Estoque Baixo (Threshold: 10)');
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.data.length).toBeGreaterThanOrEqual(2); // Produto B (3) e Produto C (1)
        expect(res.body.data.some(p => p.name === 'Produto B')).toBeTruthy();
        expect(res.body.data.some(p => p.name === 'Produto C')).toBeTruthy();
        // CORREÇÃO AQUI: Produto A (quantidade 6) está ABAIXO do threshold 10, então DEVE estar no relatório.
        expect(res.body.data.some(p => p.name === 'Produto A')).toBeTruthy(); // ALTERADO para toBeTruthy()
    });


    it('should allow an admin to get the low stock products report with custom threshold', async () => {
        const res = await request(app)
            .get('/api/reports/low-stock?threshold=2')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('Relatório de Produtos com Estoque Baixo (Threshold: 2)');
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.data.length).toEqual(1);
        expect(res.body.data[0].name).toEqual('Produto C');
        expect(res.body.data[0].quantity).toEqual(1);
    });


    it('should not allow a regular user to get the low stock products report', async () => {
        const res = await request(app)
            .get('/api/reports/low-stock')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });
});