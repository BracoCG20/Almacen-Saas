const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');

const {
  getColaboradores,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  activateColaborador,
  getColaboradorHistorial,
} = require('../controllers/colaboradoresController');

// Requieren autenticación
router.use(verifyToken);

router.get('/', getColaboradores);
router.post('/', createColaborador);
router.put('/:id', updateColaborador);
router.delete('/:id', deleteColaborador);
router.put('/:id/activate', activateColaborador);
router.get('/:id/historial', getColaboradorHistorial);

module.exports = router;
