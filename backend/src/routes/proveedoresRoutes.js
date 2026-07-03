//backend/src/routes/proveedoresRoutes.js
const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
// Importamos el nuevo middleware de memoria RAM
const { upload } = require('../middlewares/uploadMiddleware');

const {
  getProveedores,
  createProveedor,
  updateProveedor,
  toggleEstadoProveedor,
  getProveedorHistorial,
} = require('../controllers/proveedoresController');

const router = Router();

// Requieren autenticación
router.use(verifyToken);

router.get('/', getProveedores);

router.post('/', upload.single('contrato_pdf'), createProveedor);
router.put('/:id', upload.single('contrato_pdf'), updateProveedor);

router.put('/:id/estado', toggleEstadoProveedor);
router.get('/:id/historial', getProveedorHistorial);

module.exports = router;
