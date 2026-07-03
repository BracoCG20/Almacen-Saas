//backend/src/routes/configuracionRoutes.js
const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  getLicencias,
  updateLicencias,
} = require('../controllers/configuracionController');

const router = Router();

// Requieren autenticación
router.use(verifyToken);

router.get('/', getLicencias);
router.put('/licencias', updateLicencias);

module.exports = router;
