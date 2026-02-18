const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * ============================================================================
 * 1. INICIAR SESIÓN (LOGIN)
 * ============================================================================
 * Valida credenciales, comprueba estado activo y devuelve JWT + Datos de Usuario.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = `
            SELECT u.id, u.email_login, u.password_hash, u.estado, u.requiere_cambio_password, u.foto_perfil_url, u.rol_id,
                   c.nombres, c.apellidos, c.cargo, r.nombre as rol_nombre
            FROM usuarios u
            INNER JOIN colaboradores c ON u.colaborador_id = c.id
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.email_login = $1
        `;
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario o correo no encontrado.' });
    }

    const user = result.rows[0];

    // Validar si la cuenta está inactiva
    if (!user.estado) {
      return res.status(403).json({
        error:
          'Acceso denegado: Tu cuenta está inactiva. Contacta al administrador.',
      });
    }

    // Validar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    // Registrar timestamp del último login
    await pool.query(
      'UPDATE usuarios SET fecha_ultimo_login = NOW() WHERE id = $1',
      [user.id],
    );

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email_login, rol: user.rol_nombre },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: `${user.nombres} ${user.apellidos}`,
        email: user.email_login,
        foto_url: user.foto_perfil_url,
        cargo: user.cargo,
        rol_id: user.rol_id,
        rol_nombre: user.rol_nombre,
        requiere_cambio_password: user.requiere_cambio_password,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

/**
 * ============================================================================
 * 2. OBTENER PERFIL DEL USUARIO AUTENTICADO
 * ============================================================================
 */
const getPerfil = async (req, res) => {
  try {
    const id = req.user.id;

    const query = `
            SELECT u.id, u.nickname, u.email_login, u.foto_perfil_url, u.estado, u.rol_id,
                   c.dni, c.nombres, c.apellidos, c.telefono, c.cargo,
                   e.razon_social as empresa_nombre, r.nombre as rol_nombre
            FROM usuarios u
            INNER JOIN colaboradores c ON u.colaborador_id = c.id
            LEFT JOIN empresas e ON c.empresa_id = e.id
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.id = $1
        `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil.' });
  }
};

/**
 * ============================================================================
 * 3. ACTUALIZAR PERFIL (Con gestión de foto y permisos SuperAdmin)
 * ============================================================================
 */
const updatePerfil = async (req, res) => {
  const id = req.user.id;
  const { password, telefono, nombres, apellidos, cargo, email_login } =
    req.body;
  const file = req.file;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Actualización tabla USUARIOS
    const userFields = [];
    const userValues = [];
    let userIdx = 1;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      userFields.push(`password_hash = $${userIdx++}`);
      userValues.push(hash);
      userFields.push(`requiere_cambio_password = $${userIdx++}`);
      userValues.push(false);
    }
    if (email_login) {
      userFields.push(`email_login = $${userIdx++}`);
      userValues.push(email_login);
    }
    if (file) {
      const fileUrl = `/uploads/FotoPerfil/${file.filename}`;
      userFields.push(`foto_perfil_url = $${userIdx++}`);
      userValues.push(fileUrl);
    }

    let colaborador_id = null;

    if (userFields.length > 0) {
      userFields.push(`fecha_modificacion = NOW()`);
      userFields.push(`usuario_modificacion_id = $${userIdx++}`);
      userValues.push(id);

      const userQuery = `UPDATE usuarios SET ${userFields.join(', ')} WHERE id = $${userIdx} RETURNING colaborador_id`;
      userValues.push(id);
      const userResult = await client.query(userQuery, userValues);
      colaborador_id = userResult.rows[0].colaborador_id;
    } else {
      const userRes = await client.query(
        'SELECT colaborador_id FROM usuarios WHERE id = $1',
        [id],
      );
      colaborador_id = userRes.rows[0].colaborador_id;
    }

    // 2. Actualización tabla COLABORADORES
    const colabFields = [];
    const colabValues = [];
    let colabIdx = 1;

    if (telefono) {
      colabFields.push(`telefono = $${colabIdx++}`);
      colabValues.push(telefono);
    }
    if (nombres) {
      colabFields.push(`nombres = $${colabIdx++}`);
      colabValues.push(nombres);
    }
    if (apellidos) {
      colabFields.push(`apellidos = $${colabIdx++}`);
      colabValues.push(apellidos);
    }
    if (cargo) {
      colabFields.push(`cargo = $${colabIdx++}`);
      colabValues.push(cargo);
    }

    if (colabFields.length > 0) {
      colabFields.push(`fecha_modificacion = NOW()`);
      colabFields.push(`usuario_modificacion_id = $${colabIdx++}`);
      colabValues.push(id);

      const colabQuery = `UPDATE colaboradores SET ${colabFields.join(', ')} WHERE id = $${colabIdx}`;
      colabValues.push(colaborador_id);
      await client.query(colabQuery, colabValues);
    }

    await client.query('COMMIT');
    res.json({ message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * 4. CREAR ACCESO PARA UN COLABORADOR
 * ============================================================================
 */
const register = async (req, res) => {
  const { colaborador_id, nickname, email_login, password, rol_id } = req.body;
  const creador_id = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userExist = await client.query(
      'SELECT id FROM usuarios WHERE email_login = $1 OR nickname = $2',
      [email_login, nickname],
    );

    if (userExist.rows.length > 0) {
      throw new Error('El correo o nickname ya está en uso por otro usuario.');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const rolFinal = rol_id || 2;

    const usuQuery = `
            INSERT INTO usuarios (colaborador_id, rol_id, nickname, email_login, password_hash, estado, usuario_creacion_id)
            VALUES ($1, $2, $3, $4, $5, true, $6) 
            RETURNING id, email_login
        `;
    const usuResult = await client.query(usuQuery, [
      colaborador_id,
      rolFinal,
      nickname,
      email_login,
      hash,
      creador_id,
    ]);

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Acceso creado exitosamente.',
      user: usuResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en registro:', error);
    res
      .status(400)
      .json({ error: error.message || 'Error al registrar credenciales.' });
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * 5. OBTENER LISTA DE TODOS LOS USUARIOS (Vista SuperAdmin)
 * ============================================================================
 */
const getAllUsers = async (req, res) => {
  try {
    const query = `
            SELECT 
                u.id as usuario_id, u.nickname, u.email_login, u.estado as activo, u.requiere_cambio_password, u.rol_id,
                c.nombres, c.apellidos, c.cargo, c.dni,
                e.razon_social as empresa_nombre, r.nombre as nombre_rol 
            FROM usuarios u
            INNER JOIN colaboradores c ON u.colaborador_id = c.id
            LEFT JOIN empresas e ON c.empresa_id = e.id
            LEFT JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id ASC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
};

/**
 * ============================================================================
 * 6. BLOQUEAR O DESBLOQUEAR ACCESO AL SISTEMA (TOGGLE STATUS)
 * ============================================================================
 */
const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  const modificador_id = req.user.id;

  try {
    await pool.query(
      'UPDATE usuarios SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3',
      [activo, modificador_id, id],
    );
    res.json({ message: 'Estado de acceso actualizado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cambiar estado del usuario.' });
  }
};

/**
 * ============================================================================
 * 7. RESETEO DE CONTRASEÑA POR PARTE DEL ADMINISTRADOR
 * ============================================================================
 */
const adminUpdatePassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const modificador_id = req.user.id;

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Fuerza al usuario a cambiarla la próxima vez que se loguee
    await pool.query(
      'UPDATE usuarios SET password_hash = $1, requiere_cambio_password = true, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3',
      [hash, modificador_id, id],
    );
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
