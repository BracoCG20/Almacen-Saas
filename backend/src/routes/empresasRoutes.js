//backend/src/routes/empresasRoutes.js
const { Router } = require('express');
const verifyToken = require('../middlewares/authMiddleware');
const {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  activateEmpresa,
} = require('../controllers/empresasController');

const router = Router();

// Requieren autenticación
router.use(verifyToken);

router.get('/', getEmpresas);
router.post('/', createEmpresa);
router.put('/:id', updateEmpresa);
router.delete('/:id', deleteEmpresa);
router.put('/:id/activate', activateEmpresa);

module.exports = router;
