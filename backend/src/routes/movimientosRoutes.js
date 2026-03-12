const { Router } = require('express');
const router = Router();

const verifyToken = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware'); // Importamos el de memoria

const {
  registrarEntrega,
  registrarDevolucion,
  obtenerHistorial,
  subirPdfFirmado,
  invalidarFirma,
  registrarEntregaConCorreo,
  registrarDevolucionConCorreo,
  reenviarCorreoActa,
} = require('../controllers/movimientosController');

router.use(verifyToken);

router.get('/', obtenerHistorial);
router.post('/entrega', registrarEntrega);
router.post('/devolucion', registrarDevolucion);

// Todas las rutas de PDF ahora usan 'upload.single' (Memoria)
router.post(
  '/entrega-con-correo',
  upload.single('pdf'),
  registrarEntregaConCorreo,
);
router.post(
  '/devolucion-con-correo',
  upload.single('pdf'),
  registrarDevolucionConCorreo,
);
router.post('/reenviar-correo', upload.single('pdf'), reenviarCorreoActa);

router.post(
  '/:id/subir-firmado',
  upload.single('pdf'), // Cambiado de uploadFirmados a upload (memoria)
  subirPdfFirmado,
);
router.put('/:id/invalidar', invalidarFirma);

module.exports = router;
