import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = () => {
	const { user, loading } = useAuth();

	// Mientras React revisa el localStorage, mostramos un loading
	// Esto evita que te mande al Login por 1 segundo si recargas la página estando logueado
	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<h2>Cargando sistema...</h2>
			</div>
		);
	}

	// Si hay usuario, renderiza la ruta (Outlet), si no, lo patea al Login
	return user ? <Outlet /> : <Navigate to='/login' replace />;
};

export default PrivateRoute;
