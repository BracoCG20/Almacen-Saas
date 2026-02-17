const { Router } = require("express");
const router = Router();
const verifyToken = require("../middlewares/authMiddleware");

const {
	getEmpresas,
	createEmpresa,
	updateEmpresa,
	deleteEmpresa,
	activateEmpresa,
} = require("../controllers/empresasController");

// Rutas base: /api/empresas
router.get("/", verifyToken, getEmpresas);
router.post("/", verifyToken, createEmpresa);
router.put("/:id", verifyToken, updateEmpresa);
router.delete("/:id", verifyToken, deleteEmpresa);
router.put("/:id/activate", verifyToken, activateEmpresa);

module.exports = router;
