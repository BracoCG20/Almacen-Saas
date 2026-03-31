# 📦 Sistema de Gestión de Almacén e Inventario IT

[![CI Pipeline - Almacen Grupo SP](https://github.com/BracoCG20/Almacen-Saas/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/BracoCG20/Almacen-Saas/actions/workflows/ci.yml)

Una plataforma web integral diseñada para administrar, controlar y auditar el ciclo de vida de los equipos tecnológicos y activos de la empresa. Automatiza la asignación de equipos, generación de actas en PDF, recolección de firmas digitales, y mantiene una bitácora inmutable de todos los movimientos.

## ✨ Características Principales

- **Gestión de Equipos:** Registro detallado de equipos propios y alquilados (laptops, periféricos, etc.), con control de estados físicos y disponibilidad.
- **Asignaciones y Devoluciones:** Flujo de trabajo automatizado para entregar o recibir múltiples equipos simultáneamente.
- **Generación de Actas PDF:** Creación automática de documentos de entrega/devolución al instante.
- **Firmas Digitales Remotas:** Envío automático del acta por correo electrónico con un token único para que el colaborador firme desde cualquier dispositivo.
- **Auditoría e Historial:** Trazabilidad absoluta. Registra quién hizo qué, cuándo, a quién se le asignó y los tiempos exactos de uso de cada equipo.
- **Reportes en Excel:** Exportación con un clic de toda la auditoría de movimientos.
- **Directorio Corporativo:** Gestión centralizada de cuentas de correo y credenciales de los colaboradores.
- **Tiempo Real:** Notificaciones y eventos en vivo impulsados por WebSockets.
- **Almacenamiento en la Nube:** Integración robusta con Cloudinary para PDFs, contratos y fotos de perfil (credenciales seguras en BD).

## 🛠️ Tecnologías Utilizadas

**Frontend:**

- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- Estilos modulares con **SCSS**
- Iconos: **Lucide React**
- Componentes y UX: **React Select**, **Driver.js** (Tours), **React Toastify**
- Exportación de datos: **SheetJS (xlsx)**

**Backend:**

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- Base de Datos: **PostgreSQL** (`pg`)
- Almacenamiento de archivos: **Cloudinary** + **Multer**
- Tiempo Real: **Socket.io**
- Envío de correos: **Nodemailer**
- Generación de identificadores: **UUID**

## 📋 Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- **Node.js** (v18 o superior recomendado)
- **PostgreSQL** (Motor de base de datos)
- Una cuenta en **Cloudinary** (Para almacenamiento de archivos)
- Una cuenta de correo (Gmail/Outlook) para configurar la salida SMTP de **Nodemailer**.

## 🚀 Instalación y Configuración

**1. Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd almacen
```

**2. Configuración de la Base de Datos**
Crea una base de datos en PostgreSQL y ejecuta el script de creación de tablas que incluye el sistema.
_Asegúrate de ejecutar la creación de la tabla de seguridad para Cloudinary e insertar tus llaves:_

```sql
CREATE TABLE cloudinary_key (
id SERIAL PRIMARY KEY,
cloud_name VARCHAR(100) NOT NULL,
api_key VARCHAR(100) NOT NULL,
api_secret VARCHAR(100) NOT NULL,
activo BOOLEAN DEFAULT true
);
INSERT INTO cloudinary_key (cloud_name, api_key, api_secret) VALUES ('tu_cloud', 'tu_key', 'tu_secret');
```

**3. Variables de Entorno**
Crea un archivo `.env` dentro de la carpeta `backend` basándote en el archivo de ejemplo (`.env.example`). Deberás configurar:

```env
PORT=4000
DB_USER=tu_usuario_pg
DB_HOST=localhost
DB_NAME=nombre_bd
DB_PASSWORD=tu_password_pg
DB_PORT=5432

# Correo SMTP

EMAIL_USER=tu_correo@empresa.com
EMAIL_PASS=tu_contraseña_de_aplicacion
```

**4. Instalación de Dependencias**
Gracias a `concurrently` configurado en el proyecto, puedes instalar las dependencias tanto del backend como del frontend con un solo comando desde la **raíz del proyecto**:

```bash
npm run install:all
```

## 💻 Ejecución en Desarrollo

Para levantar ambos servidores (Frontend y Backend) simultáneamente, ejecuta el siguiente comando en la **raíz del proyecto**:

```bash
npm run dev
```

- El **Backend** se ejecutará en: `http://localhost:4000`
- El **Frontend** se ejecutará en: `http://localhost:5173`

## 📁 Estructura del Proyecto

```
almacen/
├── backend/ # Lógica del servidor, API REST y WebSockets
│ ├── src/
│ │ ├── config/ # Configuración de BD, Cloudinary, Mailer
│ │ ├── controllers/ # Lógica de las rutas
│ │ ├── middlewares/ # Protección de rutas y subida de archivos
│ │ ├── routes/ # Endpoints de la API
│ │ ├── services/ # Lógica de negocio profunda e interacciones SQL
│ │ └── index.js # Punto de entrada del servidor
├── frontend/ # Interfaz de usuario (React)
│ ├── src/
│ │ ├── components/ # Componentes reutilizables (Modales, Tablas, etc.)
│ │ ├── layout/ # Estructura principal (Sidebar, Navbar)
│ │ ├── pages/ # Vistas principales (Dashboard, Equipos, Historial...)
│ │ ├── service/ # Configuración de Axios (api.js)
│ │ └── styles/ # Variables SCSS y estilos globales
├── package.json # Scripts globales (concurrently)
└── README.md
```

## 🔒 Seguridad

- Las contraseñas de los usuarios están encriptadas con **Bcrypt**.
- La autenticación se maneja mediante **JSON Web Tokens (JWT)**.
- Las credenciales sensibles de la nube se administran directamente desde la base de datos, evitando su exposición en archivos de entorno.

```

```
