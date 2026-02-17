const { Router } = require("express");
const router = Router();
const verifyToken = require("../middlewares/authMiddleware");

const {
	getEquipos,
	createEquipo,
	updateEquipo,
	toggleDisponibilidad,
	getMarcas,
	getEstadosFisicos,
	getEquipoHistorial,
} = require("../controllers/equiposController");

// --- RUTAS AUXILIARES ---
router.get("/marcas", verifyToken, getMarcas);
router.get("/estados", verifyToken, getEstadosFisicos); // NUEVO

// --- RUTAS DE EQUIPOS ---
router.get("/", verifyToken, getEquipos);
router.get("/:id/historial", verifyToken, getEquipoHistorial);
router.post("/", verifyToken, createEquipo);
router.put("/:id", verifyToken, updateEquipo);

// --- RUTAS DE ESTADO (BAJA LÓGICA / ALTA) ---
router.put("/:id/disponibilidad", verifyToken, toggleDisponibilidad);

module.exports = router;
