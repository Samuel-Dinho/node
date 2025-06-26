
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user', -- 'admin' ou 'user'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        try {
            await pool.execute(query);
            console.log('Tabela "users" criada ou já existente.');
        } catch (err) {
            console.error('Erro ao criar tabela "users":', err.message);
        }
    }

    static async create(username, password, role = 'user') {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
        try {
            const [result] = await pool.execute(query, [username, hashedPassword, role]);
            return { id: result.insertId, username, role };
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Nome de usuário já existe.');
            }
            throw new Error(`Erro ao criar usuário: ${err.message}`);
        }
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        try {
            const [rows] = await pool.execute(query, [username]);
            return rows[0]; 
        } catch (err) {
            throw new Error(`Erro ao buscar usuário por username: ${err.message}`);
        }
    }

    
}

module.exports = User;