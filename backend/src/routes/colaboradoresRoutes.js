const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const {
	getColaboradores,
	createColaborador,
	updateColaborador,
	deleteColaborador,
	activateColaborador,
} = require("../controllers/colaboradoresController");

router.get("/", verifyToken, getColaboradores);
router.post("/", verifyToken, createColaborador);
router.put("/:id", verifyToken, updateColaborador);
router.delete("/:id", verifyToken, deleteColaborador);
router.put("/:id/activate", verifyToken, activateColaborador);

module.exports = router;
