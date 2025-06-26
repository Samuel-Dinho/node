
const { pool } = require('../config/db');

class Product {
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                quantity INT NOT NULL DEFAULT 0,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        try {
            await pool.execute(query);
            console.log('Tabela "products" criada ou já existente.');
        } catch (err) {
            console.error('Erro ao criar tabela "products":', err.message);
        }
    }

    static async create(name, quantity, price, category) {
        const query = 'INSERT INTO products (name, quantity, price, category) VALUES (?, ?, ?, ?)';
        try {
            const [result] = await pool.execute(query, [name, quantity, price, category]);
            return { id: result.insertId, name, quantity, price, category };
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Produto com este nome já existe.');
            }
            throw new Error(`Erro ao criar produto: ${err.message}`);
        }
    }

    static async findAll() {
        const query = 'SELECT * FROM products';
        try {
            const [rows] = await pool.execute(query);
            return rows;
        } catch (err) {
            throw new Error(`Erro ao buscar produtos: ${err.message}`);
        }
    }

    static async findById(id) {
        const query = 'SELECT * FROM products WHERE id = ?';
        try {
            const [rows] = await pool.execute(query, [id]);
            return rows[0];
        } catch (err) {
            throw new Error(`Erro ao buscar produto por ID: ${err.message}`);
        }
    }

    static async update(id, name, quantity, price, category) {
        const query = 'UPDATE products SET name = ?, quantity = ?, price = ?, category = ? WHERE id = ?';
        try {
            const [result] = await pool.execute(query, [name, quantity, price, category, id]);
            if (result.affectedRows === 0) {
                throw new Error('Produto não encontrado para atualização.');
            }
            return { id, name, quantity, price, category };
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new Error('Já existe outro produto com este nome.');
            }
            throw new Error(`Erro ao atualizar produto: ${err.message}`);
        }
    }

    static async delete(id) {
        const query = 'DELETE FROM products WHERE id = ?';
        try {
            const [result] = await pool.execute(query, [id]);
            if (result.affectedRows === 0) {
                throw new Error('Produto não encontrado para exclusão.');
            }
            return { message: 'Produto excluído com sucesso.' };
        } catch (err) {
            throw new Error(`Erro ao excluir produto: ${err.message}`);
        }
    }
    static async updateQuantity(productId, newQuantity) {
        const query = 'UPDATE products SET quantity = ? WHERE id = ?';
        try {
            const [result] = await pool.execute(query, [newQuantity, productId]);
            if (result.affectedRows === 0) {
                throw new Error('Produto não encontrado para atualização de quantidade.');
            }
            return { message: 'Quantidade do produto atualizada com sucesso.' };
        } catch (err) {
            throw new Error(`Erro ao atualizar quantidade do produto: ${err.message}`);
        }
    }
}

module.exports = Product;