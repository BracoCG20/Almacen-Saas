const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res
			.status(403)
			.json({ error: "Acceso denegado: No se proporcionó token" });
	}

	try {
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified; // Guarda el id, email_login y rol en req.user
		next();
	} catch (error) {
		res.status(401).json({ error: "Token inválido o expirado" });
	}
};

module.exports = verifyToken;
