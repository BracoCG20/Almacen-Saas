const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await authService.loginUser(email, password);
    res.json(response);
  } catch (error) {
    console.error('Error en login:', error);
    const status =
      error.message.includes('incorrecta') ||
      error.message.includes('encontrado')
        ? 400
        : 403;
    res
      .status(status)
      .json({ error: error.message || 'Error interno del servidor.' });
  }
};

const getPerfil = async (req, res) => {
  try {
    const userProfile = await authService.getUserProfile(req.user.id);
    res.json(userProfile);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res
      .status(error.message.includes('no encontrado') ? 404 : 500)
      .json({ error: 'Error al obtener perfil.' });
  }
};

const updatePerfil = async (req, res) => {
  try {
    const newFotoUrl = await authService.updateUserProfile(
      req.user.id,
      req.body,
      req.file,
    );
    res.json({
      message: 'Perfil actualizado correctamente.',
      foto_url: newFotoUrl,
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
};

const register = async (req, res) => {
  try {
    const newUser = await authService.registerUserAccess(req.user.id, req.body);
    res.status(201).json({
      message: 'Acceso creado exitosamente.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res
      .status(400)
      .json({ error: error.message || 'Error al registrar credenciales.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsersList();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    await authService.toggleStatus(id, req.user.id, activo);

    if (activo === false) {
      const io = req.app.get('io');
      io.to(`user_${id}`).emit('force_logout', {
        message: 'Un administrador ha revocado tu acceso al sistema.',
      });
    }

    res.json({ message: 'Estado de acceso actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar estado del usuario.' });
  }
};

const adminUpdatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    await authService.resetPassword(id, req.user.id, newPassword);

    res.json({
      message:
        'Contraseña reseteada. El usuario deberá crear una nueva al ingresar.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear la contraseña.' });
  }
};

module.exports = {
  login,
  getPerfil,
  updatePerfil,
  register,
  getAllUsers,
  toggleUserStatus,
  adminUpdatePassword,
};
