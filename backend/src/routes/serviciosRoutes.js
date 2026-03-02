const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const createUploadMiddleware = require('../middlewares/uploadMiddleware');

const {
  getServicios,
  createServicio,
  updateServicio,
  cambiarEstadoServicio,
  getPagosPorServicio,
  registrarPago,
  anularPago,
  getAuditoriaServicio,
  getResponsables,
} = require('../controllers/serviciosController');

const router = Router();

// Configura Multer para guardar las facturas en la subcarpeta 'Facturas'
const uploadFactura = createUploadMiddleware('Facturas', 'factura');

// Protegemos todas las rutas del módulo
router.use(verifyToken);

router.get('/', getServicios);
router.post('/', createServicio);
router.get('/responsables', getResponsables);

router.put('/:id', updateServicio);
router.put('/:id/estado', cambiarEstadoServicio);
router.get('/:id/auditoria', getAuditoriaServicio);

// --- RUTAS DE PAGOS ---
router.get('/:id/pagos', getPagosPorServicio);
router.post('/:id/pagos', uploadFactura.single('comprobante'), registrarPago);
router.put('/pagos/:pagoId/anular', anularPago);

module.exports = router;
