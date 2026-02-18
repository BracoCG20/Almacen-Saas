const { Router } = require('express');
const router = Router();
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

router.get('/marcas', verifyToken, getMarcas);
router.get('/estados', verifyToken, getEstadosFisicos); // NUEVO

router.get('/', verifyToken, getEquipos);
router.get('/:id/historial', verifyToken, getEquipoHistorial);
router.post('/', verifyToken, createEquipo);
router.put('/:id', verifyToken, updateEquipo);

router.put('/:id/disponibilidad', verifyToken, toggleDisponibilidad);

module.exports = router;
