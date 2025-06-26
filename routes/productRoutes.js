
const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();



router.post('/', authenticateToken, authorizeRole(['admin']), productController.createProduct);


router.get('/', authenticateToken, productController.getProducts);
router.get('/:id', authenticateToken, productController.getProductById);


router.put('/:id', authenticateToken, authorizeRole(['admin']), productController.updateProduct);


router.delete('/:id', authenticateToken, authorizeRole(['admin']), productController.deleteProduct);

module.exports = router;