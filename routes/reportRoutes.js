
const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();



router.get('/most-sold', authenticateToken, authorizeRole(['admin']), reportController.getMostSoldProductsReport);
router.get('/low-stock', authenticateToken, authorizeRole(['admin']), reportController.getLowStockProductsReport);

module.exports = router;