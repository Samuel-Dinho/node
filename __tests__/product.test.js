
const request = require('supertest');
const app = require('../app');
const { pool } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

describe('Product API', () => {
    let adminToken;
    let userToken;
    let productId; 

    beforeAll(async () => {
        
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        await pool.execute('DROP TABLE IF EXISTS stock_movements');
        await pool.execute('DROP TABLE IF EXISTS products');
        await pool.execute('DROP TABLE IF EXISTS users');
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        await User.createTable();
        await Product.createTable();
        await StockMovement.createTable();

        
        await request(app).post('/api/auth/register').send({ username: 'admin_products', password: 'password123', role: 'admin' });
        const adminLoginRes = await request(app).post('/api/auth/login').send({ username: 'admin_products', password: 'password123' });
        adminToken = adminLoginRes.body.token;

        
        await request(app).post('/api/auth/register').send({ username: 'user_products', password: 'password123', role: 'user' });
        const userLoginRes = await request(app).post('/api/auth/login').send({ username: 'user_products', password: 'password123' });
        userToken = userLoginRes.body.token;
    });

    afterAll(async () => {
        await pool.end(); 
    });

    
    it('should allow an admin to create a product', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Teclado Mecânico',
                quantity: 50,
                price: 350.00,
                category: 'Periféricos'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Produto cadastrado com sucesso!');
        expect(res.body.product).toHaveProperty('id');
        expect(res.body.product.name).toEqual('Teclado Mecânico');
        productId = res.body.product.id; 
    });

    
    it('should not allow an admin to create a product with duplicate name', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Teclado Mecânico', 
                quantity: 10,
                price: 300.00,
                category: 'Periféricos'
            });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message', 'Produto com este nome já existe.');
    });

    
    it('should not allow a regular user to create a product', async () => {
        const res = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Mouse Óptico',
                quantity: 100,
                price: 80.00,
                category: 'Periféricos'
            });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });

    
    it('should allow a regular user to get all products', async () => {
        const res = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThanOrEqual(1); 
        expect(res.body[0].name).toEqual('Teclado Mecânico');
    });

    
    it('should allow a regular user to get a product by ID', async () => {
        const res = await request(app)
            .get(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual('Teclado Mecânico');
    });

    
    it('should return 404 for a non-existent product', async () => {
        const res = await request(app)
            .get('/api/products/99999') 
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('message', 'Produto não encontrado.');
    });

    
    it('should allow an admin to update a product', async () => {
        const res = await request(app)
            .put(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Teclado Mecânico RGB', 
                quantity: 45,
                price: 400.00,
                category: 'Periféricos Gaming'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Produto atualizado com sucesso!');
        expect(res.body.product.name).toEqual('Teclado Mecânico RGB');
    });

    
    it('should not allow a regular user to update a product', async () => {
        const res = await request(app)
            .put(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Teclado Mecânico RGB Pro',
                quantity: 40,
                price: 450.00,
                category: 'Periféricos Gaming'
            });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });

    
    it('should allow an admin to delete a product', async () => {
        const res = await request(app)
            .delete(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Produto excluído com sucesso.');

        
        const getRes = await request(app)
            .get(`/api/products/${productId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(getRes.statusCode).toEqual(404);
    });

    
    it('should not allow a regular user to delete a product', async () => {
        
        const createRes = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Produto para Excluir Negado', quantity: 1, price: 1, category: 'Test' });
        const newProductId = createRes.body.product.id;

        const res = await request(app)
            .delete(`/api/products/${newProductId}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });
});