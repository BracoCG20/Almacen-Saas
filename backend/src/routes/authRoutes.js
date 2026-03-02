const { Router } = require('express');
const {
  login,
  getPerfil,
  updatePerfil,
  register,
  getAllUsers,
  toggleUserStatus,
  adminUpdatePassword,
} = require('../controllers/authController');

const verifyToken = require('../middlewares/authMiddleware');
const createUploadMiddleware = require('../middlewares/uploadMiddleware'); // Importamos el genérico

const router = Router();

// Configuramos que este upload guardará en "FotoPerfil" con el prefijo "perfil"
const uploadPerfil = createUploadMiddleware('FotoPerfil', 'perfil');

router.post('/login', login);

router.get('/perfil', verifyToken, getPerfil);
router.put('/perfil', verifyToken, uploadPerfil.single('foto'), updatePerfil);

router.post('/register', verifyToken, register);
router.get('/users', verifyToken, getAllUsers);
router.put('/users/:id/status', verifyToken, toggleUserStatus);
router.put('/users/:id/password', verifyToken, adminUpdatePassword);

module.exports = router;
