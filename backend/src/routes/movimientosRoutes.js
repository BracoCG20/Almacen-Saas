const { Router } = require('express');
const router = Router();
const multer = require('multer');

const verifyToken = require('../middlewares/authMiddleware');
const createUploadMiddleware = require('../middlewares/uploadMiddleware');

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

// Multer genérico que guarda físicamente en la carpeta "Firmados"
const uploadFirmados = createUploadMiddleware('Firmados', 'firmado');

// Multer en memoria (para generar el PDF al vuelo y mandarlo por email sin guardarlo en el disco)
const uploadMem = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/', obtenerHistorial);
router.post('/entrega', registrarEntrega);
router.post('/devolucion', registrarDevolucion);

router.post(
  '/entrega-con-correo',
  uploadMem.single('pdf'),
  registrarEntregaConCorreo,
);
router.post(
  '/devolucion-con-correo',
  uploadMem.single('pdf'),
  registrarDevolucionConCorreo,
);
router.post('/reenviar-correo', uploadMem.single('pdf'), reenviarCorreoActa);

router.post(
  '/:id/subir-firmado',
  uploadFirmados.single('pdf'),
  subirPdfFirmado,
);
router.put('/:id/invalidar', invalidarFirma);

module.exports = router;
