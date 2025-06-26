
const mysql = require('mysql2/promise'); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexão com o banco de dados MySQL estabelecida com sucesso!');
        connection.release(); 
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados MySQL:', err.message);
        process.exit(1); 
    }
}

module.exports = {
    pool,
    testDbConnection
};