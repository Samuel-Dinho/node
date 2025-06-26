
const { pool } = require('../config/db');

class Report {
    static async getMostSoldProducts() {
        try {
            const [rows] = await pool.execute(
                `SELECT p.id, p.name, p.category, 
                    CAST(SUM(sm.quantity) AS UNSIGNED) AS total_sold_quantity 
             FROM stock_movements sm
             JOIN products p ON sm.product_id = p.id
             WHERE sm.type = 'saida'
             GROUP BY p.id, p.name, p.category
             ORDER BY total_sold_quantity DESC
             LIMIT 10`
            );
            return rows;
        } catch (error) {
            console.error("Erro ao obter produtos mais vendidos:", error);
            throw error;
        }
    }

    static async getLowStockProducts(threshold = 10) {
        const query = `
            SELECT
                id,
                name,
                quantity,
                price,
                category
            FROM
                products
            WHERE
                quantity <= ?
            ORDER BY
                quantity ASC;
        `;
        try {
            const [rows] = await pool.execute(query, [threshold]);
            return rows;
        } catch (err) {
            throw new Error(`Erro ao buscar produtos com estoque baixo: ${err.message}`);
        }
    }
}

module.exports = Report;