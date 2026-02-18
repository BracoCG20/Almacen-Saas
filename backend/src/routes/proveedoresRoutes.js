const { Router } = require('express');
const router = Router();
const verifyToken = require('../middlewares/authMiddleware');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `contrato_prov_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  activateProveedor,
} = require('../controllers/proveedoresController');

router.get('/', verifyToken, getProveedores);

router.post('/', verifyToken, upload.single('contrato_pdf'), createProveedor);
router.put('/:id', verifyToken, upload.single('contrato_pdf'), updateProveedor);

router.delete('/:id', verifyToken, deleteProveedor);
router.put('/:id/activate', verifyToken, activateProveedor);

module.exports = router;
