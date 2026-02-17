const { Router } = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middlewares/authMiddleware");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, "factura-" + uniqueSuffix + path.extname(file.originalname));
	},
});
const upload = multer({ storage: storage });

const {
	getServicios,
	createServicio,
	updateServicio,
	cambiarEstadoServicio,
	getPagosPorServicio,
	registrarPago,
	anularPago,
	getAuditoriaServicio,
	getResponsables, // <--- IMPORTADO AQUÍ
} = require("../controllers/serviciosController");

// --- RUTAS GENERALES ---
router.get("/", verifyToken, getServicios);
router.post("/", verifyToken, createServicio);

// --- RUTA NUEVA PARA EL SELECT DEL FORMULARIO ---
router.get("/responsables", verifyToken, getResponsables); // <--- DEBE IR AQUÍ

// --- RUTAS CON ID ---
router.put("/:id", verifyToken, updateServicio);
router.put("/:id/estado", verifyToken, cambiarEstadoServicio);
router.get("/:id/auditoria", verifyToken, getAuditoriaServicio);

// --- PAGOS ---
router.get("/:id/pagos", verifyToken, getPagosPorServicio);
router.post(
	"/:id/pagos",
	verifyToken,
	upload.single("comprobante"),
	registrarPago,
);
router.put("/pagos/:pagoId/anular", verifyToken, anularPago);

module.exports = router;
