import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";

const MainLayout = () => {
	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				width: "100vw",
				overflow: "hidden",
				backgroundColor: "#f8fafc", // Fondo moderno gris muy claro para toda la app
				fontFamily: "'Inter', system-ui, sans-serif", // Tipografía global
			}}
		>
			<Sidebar />

			{/* Contenedor principal del contenido */}
			<main
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "2.5rem 3rem", // Respiración generosa alrededor del contenido
				}}
			>
				{/* Envoltorio para centrar y limitar el ancho en monitores gigantes */}
				<div style={{ maxWidth: "1600px", margin: "0 auto", height: "100%" }}>
					<Outlet />
				</div>
			</main>
		</div>
	);
};

export default MainLayout;
