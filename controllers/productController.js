// controllers/productController.js
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
    const { name, quantity, price, category } = req.body;

    if (!name || quantity === undefined || price === undefined || !category) {
        return res.status(400).json({ message: 'Todos os campos (nome, quantidade, preço, categoria) são obrigatórios.' });
    }
    if (quantity < 0 || price < 0) {
        return res.status(400).json({ message: 'Quantidade e preço devem ser valores positivos.' });
    }

    try {
        const newProduct = await Product.create(name, quantity, price, category);
        res.status(201).json({ message: 'Produto cadastrado com sucesso!', product: newProduct });
    } catch (error) {
        if (error.message.includes('Produto com este nome já existe.')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao cadastrar produto.', error: error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar produtos.', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar produto.', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, quantity, price, category } = req.body;

    if (!name || quantity === undefined || price === undefined || !category) {
        return res.status(400).json({ message: 'Todos os campos (nome, quantidade, preço, categoria) são obrigatórios.' });
    }
    if (quantity < 0 || price < 0) {
        return res.status(400).json({ message: 'Quantidade e preço devem ser valores positivos.' });
    }

    try {
        const updatedProduct = await Product.update(id, name, quantity, price, category);
        res.status(200).json({ message: 'Produto atualizado com sucesso!', product: updatedProduct });
    } catch (error) {
        if (error.message.includes('Produto não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes('Já existe outro produto com este nome.')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao atualizar produto.', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.delete(id);
        res.status(200).json({ message: 'Produto excluído com sucesso.' });
    } catch (error) {
        if (error.message.includes('Produto não encontrado')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao excluir produto.', error: error.message });
    }
};