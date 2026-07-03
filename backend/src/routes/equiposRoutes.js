//backend/src/routes/equiposRoutes.js
const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware'); // <-- IMPORTAMOS EL MIDDLEWARE DE SUBIDA
const {
  getEquipos,
  createEquipo,
  updateEquipo,
  toggleDisponibilidad,
  getMarcas,
  getEstadosFisicos,
  getEquipoHistorial,
  uploadImagenEquipo, // <-- NUEVO CONTROLADOR
} = require('../controllers/equiposController');

const router = Router();

// Requieren autenticación
router.use(verifyToken);

router.get('/marcas', getMarcas);
router.get('/estados', getEstadosFisicos);

router.get('/', getEquipos);
router.post('/', createEquipo);
router.get('/:id/historial', getEquipoHistorial);
router.put('/:id', updateEquipo);
router.put('/:id/disponibilidad', toggleDisponibilidad);

// --- NUEVA RUTA PARA SUBIR IMAGEN ---
router.put('/:id/imagen', upload.single('imagen'), uploadImagenEquipo);

module.exports = router;
