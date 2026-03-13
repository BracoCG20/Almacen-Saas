const { Router } = require('express');
const multer = require('multer'); // Si no tienes un upload global exportado
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

const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/', obtenerTickets);
router.post('/', crearTicket);
router.get('/:id/historial', obtenerHistorialTicket);
router.put('/:id', actualizarTicket);

router.post(
  '/:id/comentarios',
  upload.single('archivo'),
  agregarComentarioTicket,
);

router.put('/:id/asignar', asignarTicket);

module.exports = router;
