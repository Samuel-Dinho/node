// models/StockMovement.js
const { pool } = require('../config/db');

class StockMovement {
    static async createTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS stock_movements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                type ENUM('entrada', 'saida') NOT NULL,
                quantity INT NOT NULL,
                movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INT,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `;
        try {
            await pool.execute(query);
            console.log('Tabela "stock_movements" criada ou já existente.');
        } catch (err) {
            console.error('Erro ao criar tabela "stock_movements":', err.message);
            throw new Error(`Erro ao criar tabela "stock_movements": ${err.message}`);
        }
    }

    static async create(productId, type, quantity, userId) {
        const query = `
            INSERT INTO stock_movements (product_id, type, quantity, user_id)
            VALUES (?, ?, ?, ?)
        `;
        try {
            const [result] = await pool.execute(query, [productId, type, quantity, userId]);
            return result;
        } catch (err) {
            console.error("Erro ao registrar movimento de estoque (no model):", err.message);
            throw new Error(`Erro ao registrar movimento de estoque: ${err.message}`);
        }
    }

    static async getMovementHistory(productId) {
        const query = `
            SELECT
                sm.id,
                sm.type,
                sm.quantity,
                sm.movement_date,
                u.username AS responsible_user
            FROM
                stock_movements sm
            LEFT JOIN
                users u ON sm.user_id = u.id
            WHERE
                sm.product_id = ?
            ORDER BY
                sm.movement_date DESC, sm.id DESC -- Adicionada ordenação por ID para desempate
        `;
        try {
            const [rows] = await pool.execute(query, [productId]);
            return rows;
        } catch (err) {
            console.error('Erro ao buscar histórico de movimentos (no model):', err.message);
            throw new Error(`Erro ao buscar histórico de movimentos: ${err.message}`);
        }
    }
}

module.exports = StockMovement;