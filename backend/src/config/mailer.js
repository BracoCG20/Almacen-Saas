const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

transporter.verify().then(() => {
	console.log("Listo para enviar correos");
});

module.exports = transporter;
