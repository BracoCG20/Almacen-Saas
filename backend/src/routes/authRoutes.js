const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/FotoPerfil');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'perfil-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post('/login', login);

router.get('/perfil', verifyToken, getPerfil);
router.put('/perfil', verifyToken, upload.single('foto'), updatePerfil);

router.post('/register', verifyToken, register);
router.get('/users', verifyToken, getAllUsers);
router.put('/users/:id/status', verifyToken, toggleUserStatus);
router.put('/users/:id/password', verifyToken, adminUpdatePassword);

module.exports = router;
