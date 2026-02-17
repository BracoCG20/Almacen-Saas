import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Login.scss";

// Asegúrate de que la ruta de la imagen sea correcta en tu File Tree
import logo from "../../assets/logo_grupoSP.png";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const { login } = useContext(AuthContext);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await login(email, password);

			if (result && result.success) {
				toast.success("Bienvenido al sistema");
				navigate("/");
			} else {
				toast.error(result?.message || "Credenciales incorrectas");
				setIsLoading(false);
			}
		} catch (error) {
			toast.error("Error al conectar con el servidor");
			setIsLoading(false);
		}
	};

	return (
		<div className='login-container'>
			<div className='login-card-wrapper'>
				<div className='login-image'>
					<img src={logo} alt='Logo Grupo SP' />
				</div>

				<div className='login-card'>
					<h2>Sistema Almacén</h2>
					<br />

					<form onSubmit={handleSubmit}>
						<div className='input-group'>
							<label>Correo Electrónico</label>
							<input
								type='email'
								placeholder='cbraco@gruposp.pe'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<div className='input-group'>
							<label>Contraseña</label>
							<input
								type='password'
								placeholder='••••••••'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<button
							type='submit'
							disabled={isLoading}
							className={isLoading ? "btn-loading" : ""}
						>
							{isLoading ? "Ingresando..." : "Ingresar"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;
