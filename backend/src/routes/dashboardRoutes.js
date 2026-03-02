const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = Router();

router.get('/', verifyToken, getDashboardStats);

module.exports = router;
