//backend/src/routes/serviciosRoutes.js
const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
// Importamos el nuevo middleware de memoria RAM
const { upload } = require('../middlewares/uploadMiddleware');

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

router.use(verifyToken);

router.get('/', getServicios);
router.post('/', createServicio);
router.get('/responsables', getResponsables);

router.put('/:id', updateServicio);
router.put('/:id/estado', cambiarEstadoServicio);
router.get('/:id/auditoria', getAuditoriaServicio);

router.get('/:id/pagos', getPagosPorServicio);

router.post('/:id/pagos', upload.single('comprobante'), registrarPago);

router.put('/pagos/:pagoId/anular', anularPago);

module.exports = router;
