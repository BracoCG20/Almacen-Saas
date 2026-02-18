const { Router } = require("express");
const router = Router();
const verifyToken = require("../middlewares/authMiddleware");

// Importar Multer para subida de archivos (Contratos)
const multer = require("multer");
const path = require("path");

// Configuración básica de almacenamiento
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/"); // Asegúrate de tener una carpeta "uploads" en tu backend
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
} = require("../controllers/proveedoresController");

router.get("/", verifyToken, getProveedores);

// AHORA SOPORTAN ARCHIVOS (contrato_pdf)
router.post("/", verifyToken, upload.single("contrato_pdf"), createProveedor);
router.put("/:id", verifyToken, upload.single("contrato_pdf"), updateProveedor);

router.delete("/:id", verifyToken, deleteProveedor);
router.put("/:id/activate", verifyToken, activateProveedor);

module.exports = router;
