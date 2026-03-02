const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  getEquipos,
  createEquipo,
  updateEquipo,
  toggleDisponibilidad,
  getMarcas,
  getEstadosFisicos,
  getEquipoHistorial,
} = require('../controllers/equiposController');

const router = Router();

// Todas las rutas de equipos requieren autenticación
router.use(verifyToken);

router.get('/marcas', getMarcas);
router.get('/estados', getEstadosFisicos);

router.get('/', getEquipos);
router.post('/', createEquipo);
router.get('/:id/historial', getEquipoHistorial);
router.put('/:id', updateEquipo);
router.put('/:id/disponibilidad', toggleDisponibilidad);

module.exports = router;
