
const request = require('supertest');
const app = require('../app'); 
const { pool } = require('../config/db'); 


const User = require('../models/User');
const Product = require('../models/Product'); 
const StockMovement = require('../models/StockMovement'); 

describe('Auth API', () => {
    let adminToken;
    let userId; 

    beforeAll(async () => {
        
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        await pool.execute('DROP TABLE IF EXISTS stock_movements');
        await pool.execute('DROP TABLE IF EXISTS products');
        await pool.execute('DROP TABLE IF EXISTS users');
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        
        await User.createTable();
        await Product.createTable(); 
        await StockMovement.createTable(); 

        
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'admin_test', password: 'password123', role: 'admin' });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin_test', password: 'password123' });
        adminToken = loginRes.body.token;
    });

    afterAll(async () => {
        
        await pool.end(); 
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'testpassword',
                role: 'user'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso!');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user).toHaveProperty('username', 'testuser');
        userId = res.body.user.id; 
    });

    it('should not register a user with existing username', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'anotherpassword',
                role: 'user'
            });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message', 'Nome de usuário já existe.');
    });

    it('should login a user and return a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message', 'Credenciais inválidas.');
    });

    
    
    
    
    
    it('should access admin-only route with admin token', async () => {
        const res = await request(app)
            .get('/api/admin-only') 
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Você acessou uma rota de administrador!');
    });

    it('should not access admin-only route with user token', async () => {
        
        const userLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser', password: 'testpassword' });
        const userToken = userLoginRes.body.token;

        const res = await request(app)
            .get('/api/admin-only')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(403); 
        expect(res.body).toHaveProperty('message', 'Acesso negado. Você não tem permissão para esta ação.');
    });

    it('should not access admin-only route without token', async () => {
        const res = await request(app)
            .get('/api/admin-only');
        expect(res.statusCode).toEqual(401); 
        expect(res.body).toHaveProperty('message', 'Token não fornecido.');
    });

});