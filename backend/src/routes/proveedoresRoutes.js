const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const createUploadMiddleware = require('../middlewares/uploadMiddleware');

const {
  getProveedores,
  createProveedor,
  updateProveedor,
  toggleEstadoProveedor,
  getProveedorHistorial,
} = require('../controllers/proveedoresController');

const router = Router();

// Configuramos que este upload guardará los PDFs en "ContratosProveedores" con el prefijo "contrato_prov"
const uploadContrato = createUploadMiddleware(
  'ContratosProveedores',
  'contrato_prov',
);

// Todas las rutas requieren estar autenticado
router.use(verifyToken);

router.get('/', getProveedores);
router.post('/', uploadContrato.single('contrato_pdf'), createProveedor);
router.put('/:id', uploadContrato.single('contrato_pdf'), updateProveedor);
router.put('/:id/estado', toggleEstadoProveedor);
router.get('/:id/historial', getProveedorHistorial);

module.exports = router;
