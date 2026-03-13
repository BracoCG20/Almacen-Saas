require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { pool } = require('./config/db');
const mailer = require('./config/mailer');

// Inicializar Express
const app = express();

// Crear servidor HTTP usando Express
const server = http.createServer(app);

// Inicializar Socket.io sobre el servidor HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // En producción, colocar la URL del frontend (ej. 'http://localhost:5173')
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// MIDDLEWARES
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EVENTOS DE SOCKET.IO
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado a WebSocket:', socket.id);

  // Cuando un usuario se loguea en el frontend, se unirá a una "sala" personal con su ID
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Usuario ${userId} se unió a su sala personal`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});

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
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const colaboradoresRoutes = require('./routes/colaboradoresRoutes');
app.use('/api/colaboradores', colaboradoresRoutes);

const empresasRoutes = require('./routes/empresasRoutes');
app.use('/api/empresas', empresasRoutes);

const equiposRoutes = require('./routes/equiposRoutes');
app.use('/api/equipos', equiposRoutes);

const proveedoresRoutes = require('./routes/proveedoresRoutes');
app.use('/api/proveedores', proveedoresRoutes);

const movimientosRoutes = require('./routes/movimientosRoutes');
app.use('/api/movimientos', movimientosRoutes);

const serviciosRoutes = require('./routes/serviciosRoutes');
app.use('/api/servicios', serviciosRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

const firmasRoutes = require('./routes/firmasRoutes');
app.use('/api/firmas', firmasRoutes);

const directorioRoutes = require('./routes/directorioRoutes');
app.use('/api/directorio', directorioRoutes);

const configuracionRoutes = require('./routes/configuracionRoutes');
app.use('/api/configuracion', configuracionRoutes);

const ticketsRoutes = require('./routes/ticketsRoutes');
app.use('/api/tickets', ticketsRoutes);

// ==========================================
// INICIAR EL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔌 WebSockets habilitados y escuchando`);
  console.log(`-------------------------------------------`);
});
