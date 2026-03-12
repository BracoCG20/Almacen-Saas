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

const uploadFactura = createUploadMiddleware('Facturas', 'factura');

router.use(verifyToken);

router.get('/', getServicios);
router.post('/', createServicio);
router.get('/responsables', getResponsables);

router.put('/:id', updateServicio);
router.put('/:id/estado', cambiarEstadoServicio);
router.get('/:id/auditoria', getAuditoriaServicio);

router.get('/:id/pagos', getPagosPorServicio);
router.post('/:id/pagos', uploadFactura.single('comprobante'), registrarPago);
router.put('/pagos/:pagoId/anular', anularPago);

module.exports = router;
