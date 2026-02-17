import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
// import WhatsappBtn from "../components/WhatsappBtn/WhatsappBtn";

const MainLayout = () => {
	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				overflow: "hidden",
				backgroundColor: "#f3f4f6", // Tu $bg-body
			}}
		>
			<Sidebar />

			<main style={{ flex: 1, padding: "2.5vh 2rem", overflowY: "auto" }}>
				<Outlet />
			</main>

			{/* <WhatsappBtn /> */}
		</div>
	);
};

export default MainLayout;
