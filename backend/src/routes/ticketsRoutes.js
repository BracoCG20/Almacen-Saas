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

// Configuramos multer en memoria para interceptar el archivo antes de enviarlo a Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/', obtenerTickets);
router.post('/', crearTicket);
router.get('/:id/historial', obtenerHistorialTicket);
router.put('/:id', actualizarTicket);

// Añadimos upload.single('archivo') para que multer procese el FormData
router.post(
  '/:id/comentarios',
  upload.single('archivo'),
  agregarComentarioTicket,
);

router.put('/:id/asignar', asignarTicket);

module.exports = router;
