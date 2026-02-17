const { Router } = require("express");
const router = Router();
const verifyToken = require("../middlewares/authMiddleware");

const { getDashboardStats } = require("../controllers/dashboardController");

router.get("/", verifyToken, getDashboardStats);

module.exports = router;
