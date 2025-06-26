
const express = require('express');
const stockController = require('../controllers/stockController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();



router.post('/movement', authenticateToken, authorizeRole(['admin']), stockController.createStockMovement); 


router.post('/entry', authenticateToken, authorizeRole(['admin']), stockController.registerEntry);
router.post('/exit', authenticateToken, authorizeRole(['admin']), stockController.registerExit);



router.get('/:productId', authenticateToken, stockController.getProductQuantity);


router.get('/history/:productId', authenticateToken, stockController.getProductMovementHistory);

module.exports = router;