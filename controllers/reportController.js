
const Report = require('../models/Report');

exports.getMostSoldProductsReport = async (req, res) => {
    try {
        const mostSold = await Report.getMostSoldProducts();
        res.status(200).json({
            message: 'Relatório de Produtos Mais Vendidos',
            data: mostSold
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar relatório de produtos mais vendidos.', error: error.message });
    }
};

exports.getLowStockProductsReport = async (req, res) => {
    
    const threshold = parseInt(req.query.threshold) || 10; 

    try {
        const lowStock = await Report.getLowStockProducts(threshold);
        res.status(200).json({
            message: `Relatório de Produtos com Estoque Baixo (Threshold: ${threshold})`,
            data: lowStock
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerar relatório de produtos com estoque baixo.', error: error.message });
    }
};