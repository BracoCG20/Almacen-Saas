const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  obtenerDirectorio,
  crearRegistroDirectorio,
  actualizarRegistroDirectorio,
  eliminarRegistroDirectorio,
  obtenerEstadisticas,
  obtenerHistorialCompleto,
} = require('../controllers/directorioController');

const router = Router();

// Requieren autenticación
router.use(verifyToken);

router.get('/estadisticas', obtenerEstadisticas);
router.get('/historial', obtenerHistorialCompleto);
router.get('/', obtenerDirectorio);
router.post('/', crearRegistroDirectorio);
router.put('/:id', actualizarRegistroDirectorio);
router.delete('/:id', eliminarRegistroDirectorio);

module.exports = router;
