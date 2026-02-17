const { Router } = require("express");
const router = Router();
const verifyToken = require("../middlewares/authMiddleware");
const {
	getProveedores,
	createProveedor,
	updateProveedor,
	deleteProveedor,
	activateProveedor,
} = require("../controllers/proveedoresController");

router.get("/", verifyToken, getProveedores);
router.post("/", verifyToken, createProveedor);
router.put("/:id", verifyToken, updateProveedor);
router.delete("/:id", verifyToken, deleteProveedor);
router.put("/:id/activate", verifyToken, activateProveedor);

module.exports = router;
