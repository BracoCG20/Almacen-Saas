const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  getLicencias,
  updateLicencias,
} = require('../controllers/configuracionController');

const router = Router();

// Todas las rutas de configuración requieren autenticación
router.use(verifyToken);

router.get('/', getLicencias);
router.put('/licencias', updateLicencias);

module.exports = router;
