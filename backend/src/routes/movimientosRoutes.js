const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middlewares/authMiddleware');

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

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'firmado-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
const uploadMem = multer({ storage: multer.memoryStorage() });

router.get('/', verifyToken, obtenerHistorial);
router.post('/entrega', verifyToken, registrarEntrega);
router.post('/devolucion', verifyToken, registrarDevolucion);

router.post(
  '/entrega-con-correo',
  verifyToken,
  uploadMem.single('pdf'),
  registrarEntregaConCorreo,
);
router.post(
  '/devolucion-con-correo',
  verifyToken,
  uploadMem.single('pdf'),
  registrarDevolucionConCorreo,
);

// --- RUTA PARA REENVIAR CORREO---
router.post(
  '/reenviar-correo',
  verifyToken,
  uploadMem.single('pdf'),
  reenviarCorreoActa,
);

router.post(
  '/:id/subir-firmado',
  verifyToken,
  upload.single('pdf'),
  subirPdfFirmado,
);
router.put('/:id/invalidar', verifyToken, invalidarFirma);

module.exports = router;
