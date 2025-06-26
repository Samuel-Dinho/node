
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');


exports.createStockMovement = async (req, res) => {
    const { productId, quantity, type } = req.body; 
    const userId = req.user.id;

    if (!productId || quantity === undefined || quantity <= 0 || !['entrada', 'saida'].includes(type)) {
        return res.status(400).json({ message: 'ID do produto, quantidade positiva e tipo (entrada/saida) são obrigatórios.' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        let newQuantity = product.quantity;
        if (type === 'entrada') {
            newQuantity = product.quantity + quantity;
        } else if (type === 'saida') {
            if (product.quantity < quantity) {
                return res.status(400).json({ message: 'Quantidade em estoque insuficiente para esta saída.' });
            }
            newQuantity = product.quantity - quantity;
        }

        await Product.updateQuantity(productId, newQuantity);
        await StockMovement.create(productId, type, quantity, userId);

        res.status(200).json({ message: `Movimento de estoque registrado com sucesso! Nova quantidade: ${newQuantity}.`, product: { id: product.id, name: product.name, quantity: newQuantity } });
    } catch (error) {
        console.error("Erro em createStockMovement:", error);
        res.status(500).json({ message: 'Erro ao registrar movimento de estoque.', error: error.message });
    }
};



exports.registerEntry = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || quantity === undefined || quantity <= 0) {
        return res.status(400).json({ message: 'ID do produto e quantidade positiva são obrigatórios para entrada.' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        const newQuantity = product.quantity + quantity;
        await Product.updateQuantity(productId, newQuantity);
        await StockMovement.create(productId, 'entrada', quantity, userId);

        res.status(200).json({ message: `Entrada de ${quantity} unidades para o produto "${product.name}" registrada. Nova quantidade: ${newQuantity}.`, product: { id: product.id, name: product.name, quantity: newQuantity } });
    } catch (error) {
        console.error("Erro ao registrar entrada de estoque:", error);
        res.status(500).json({ message: 'Erro ao registrar entrada de estoque.', error: error.message });
    }
};


exports.registerExit = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || quantity === undefined || quantity <= 0) {
        return res.status(400).json({ message: 'ID do produto e quantidade positiva são obrigatórios para saída.' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ message: 'Quantidade em estoque insuficiente para esta saída.' });
        }

        const newQuantity = product.quantity - quantity;
        await Product.updateQuantity(productId, newQuantity);
        await StockMovement.create(productId, 'saida', quantity, userId);

        res.status(200).json({ message: `Saída de ${quantity} unidades para o produto "${product.name}" registrada. Nova quantidade: ${newQuantity}.`, product: { id: product.id, name: product.name, quantity: newQuantity } });
    } catch (error) {
        console.error("Erro ao registrar saída de estoque:", error);
        res.status(500).json({ message: 'Erro ao registrar saída de estoque.', error: error.message });
    }
};



exports.getProductQuantity = async (req, res) => {
    const { productId } = req.params;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.status(200).json({
            productId: product.id,
            productName: product.name,
            currentQuantity: product.quantity
        });
    } catch (error) {
        console.error("Erro ao obter quantidade do produto:", error);
        res.status(500).json({ message: 'Erro ao obter quantidade do produto.', error: error.message });
    }
};



exports.getProductMovementHistory = async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        
        const history = await StockMovement.getMovementHistory(productId); 
        res.status(200).json({
            productName: product.name,
            currentQuantity: product.quantity,
            history: history
        });
    } catch (error) {
        console.error("Erro ao buscar histórico de movimentos do produto:", error);
        res.status(500).json({ message: 'Erro ao buscar histórico de movimentos do produto.', error: error.message });
    }
};