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

// Todas las rutas requieren estar autenticado
router.use(verifyToken);

router.get('/', getProveedores);

// Usamos upload.single para procesar en memoria y subir a Cloudinary
router.post('/', upload.single('contrato_pdf'), createProveedor);
router.put('/:id', upload.single('contrato_pdf'), updateProveedor);

router.put('/:id/estado', toggleEstadoProveedor);
router.get('/:id/historial', getProveedorHistorial);

module.exports = router;
