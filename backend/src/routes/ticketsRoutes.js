const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  obtenerTickets,
  obtenerHistorialTicket,
  crearTicket,
  actualizarTicket,
  agregarComentarioTicket,
  asignarTicket,
} = require('../controllers/ticketsController');

const router = Router();

router.use(verifyToken);

router.get('/', obtenerTickets);
router.post('/', crearTicket);
router.get('/:id/historial', obtenerHistorialTicket);
router.put('/:id', actualizarTicket);
router.post('/:id/comentarios', agregarComentarioTicket);
router.put('/:id/asignar', asignarTicket);

module.exports = router;
