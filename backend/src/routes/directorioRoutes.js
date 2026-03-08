const { Router } = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const {
	obtenerDirectorio,
	crearRegistroDirectorio,
	actualizarRegistroDirectorio,
	eliminarRegistroDirectorio,
	obtenerEstadisticas,
} = require("../controllers/directorioController");

const router = Router();

// Todas las rutas de directorio están protegidas
router.use(verifyToken);

// IMPORTANTE: /estadisticas debe ir antes de las rutas con /:id
router.get("/estadisticas", obtenerEstadisticas);
router.get("/", obtenerDirectorio);
router.post("/", crearRegistroDirectorio);
router.put("/:id", actualizarRegistroDirectorio);
router.delete("/:id", eliminarRegistroDirectorio);

module.exports = router;
