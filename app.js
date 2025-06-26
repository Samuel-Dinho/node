
require('dotenv').config();
const express = require('express');
const { testDbConnection } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const StockMovement = require('./models/StockMovement');
const Report = require('./models/Report'); 

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');
const reportRoutes = require('./routes/reportRoutes'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function initializeApp() {
    await testDbConnection();
    await User.createTable();
    await Product.createTable();
    await StockMovement.createTable();
    

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

initializeApp();


app.get('/', (req, res) => {
    res.send('API de Controle de Estoque Funcionando!');
});


app.use('/api/auth', authRoutes);


app.use('/api/products', productRoutes);


app.use('/api/stock', stockRoutes);


app.use('/api/reports', reportRoutes);

const { authenticateToken, authorizeRole } = require('./middleware/authMiddleware');
app.get('/api/admin-only', authenticateToken, authorizeRole(['admin']), (req, res) => {
    res.status(200).json({ message: 'Você acessou uma rota de administrador!' });
});

module.exports = app;