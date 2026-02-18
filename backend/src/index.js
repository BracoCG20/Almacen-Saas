// 1. Cargar variables de entorno (Siempre línea 1)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { pool } = require('./config/db');
const mailer = require('./config/mailer');

// Inicializar Express
const app = express();

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hacer pública la carpeta de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// RUTAS DE LA API
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor del Sistema de Almacén funcionando al 100% 🚀',
  });
});

// --- MÓDULOS DEL SISTEMA ---

// 1. Autenticación (Login, Perfil, Registro inicial)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 2. Gestión de Colaboradores
const colaboradoresRoutes = require('./routes/colaboradoresRoutes');
app.use('/api/colaboradores', colaboradoresRoutes);

// 3. Gestión de Empresas
const empresasRoutes = require('./routes/empresasRoutes');
app.use('/api/empresas', empresasRoutes);

// 4. Gestión de Equipos e Inventario
const equiposRoutes = require('./routes/equiposRoutes');
app.use('/api/equipos', equiposRoutes);

// 5. Gestión de Proveedores
const proveedoresRoutes = require('./routes/proveedoresRoutes');
app.use('/api/proveedores', proveedoresRoutes);

// 6. Gestión de Movimientos (Entregas y Devoluciones)
const movimientosRoutes = require('./routes/movimientosRoutes');
app.use('/api/movimientos', movimientosRoutes);

// 7. Gestión de Servicios (SaaS, Licencias y Pagos)
const serviciosRoutes = require('./routes/serviciosRoutes');
app.use('/api/servicios', serviciosRoutes);

// 8. Dashboard
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// ==========================================
// INICIAR EL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`===========================================`);
});
