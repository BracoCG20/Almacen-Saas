const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (email, password) => {
  const query = `
    SELECT u.id, u.email_login, u.password_hash, u.estado, u.requiere_cambio_password, u.foto_perfil_url, u.rol_id,
           c.nombres, c.apellidos, c.cargo, r.nombre as rol_nombre
    FROM usuarios u
    INNER JOIN colaboradores c ON u.colaborador_id = c.id
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE u.email_login = $1
  `;
  const result = await pool.query(query, [email]);

  if (result.rows.length === 0)
    throw new Error('Usuario o correo no encontrado.');

  const user = result.rows[0];

  if (!user.estado)
    throw new Error(
      'Acceso denegado: Tu cuenta está inactiva. Contacta al administrador.',
    );

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new Error('Contraseña incorrecta.');

  await pool.query(
    'UPDATE usuarios SET fecha_ultimo_login = NOW() WHERE id = $1',
    [user.id],
  );

  const token = jwt.sign(
    { id: user.id, email: user.email_login, rol: user.rol_nombre },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );

  return {
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
  };
};

const getUserProfile = async (userId) => {
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
  const result = await pool.query(query, [userId]);
  if (result.rows.length === 0) throw new Error('Usuario no encontrado.');
  return result.rows[0];
};

const updateUserProfile = async (
  userId,
  { password, telefono, nombres, apellidos, cargo, email_login },
  file,
) => {
  const client = await pool.connect();
  let newFotoUrl = null;

  try {
    await client.query('BEGIN');

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
      newFotoUrl = fileUrl;
    }

    let colaborador_id = null;

    if (userFields.length > 0) {
      userFields.push(`fecha_modificacion = NOW()`);
      userFields.push(`usuario_modificacion_id = $${userIdx++}`);
      userValues.push(userId);

      const userQuery = `UPDATE usuarios SET ${userFields.join(', ')} WHERE id = $${userIdx} RETURNING colaborador_id`;
      userValues.push(userId);
      const userResult = await client.query(userQuery, userValues);
      colaborador_id = userResult.rows[0].colaborador_id;
    } else {
      const userRes = await client.query(
        'SELECT colaborador_id FROM usuarios WHERE id = $1',
        [userId],
      );
      colaborador_id = userRes.rows[0].colaborador_id;
    }

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
      colabValues.push(userId);

      const colabQuery = `UPDATE colaboradores SET ${colabFields.join(', ')} WHERE id = $${colabIdx}`;
      colabValues.push(colaborador_id);
      await client.query(colabQuery, colabValues);
    }

    await client.query('COMMIT');
    return newFotoUrl;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const registerUserAccess = async (
  creador_id,
  { colaborador_id, nickname, email_login, password, rol_id },
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userExist = await client.query(
      'SELECT id FROM usuarios WHERE email_login = $1 OR nickname = $2',
      [email_login, nickname],
    );
    if (userExist.rows.length > 0)
      throw new Error('El correo o nickname ya está en uso por otro usuario.');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const rolFinal = rol_id || 2;

    const usuQuery = `
      INSERT INTO usuarios (colaborador_id, rol_id, nickname, email_login, password_hash, estado, usuario_creacion_id)
      VALUES ($1, $2, $3, $4, $5, true, $6) RETURNING id, email_login
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
    return usuResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getAllUsersList = async () => {
  const query = `
    SELECT u.id as usuario_id, u.nickname, u.email_login, u.estado as activo, u.requiere_cambio_password, u.rol_id,
           c.nombres, c.apellidos, c.cargo, c.dni,
           e.razon_social as empresa_nombre, r.nombre as nombre_rol 
    FROM usuarios u
    INNER JOIN colaboradores c ON u.colaborador_id = c.id
    LEFT JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN roles r ON u.rol_id = r.id
    ORDER BY u.id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

const toggleStatus = async (userId, modificadorId, activo) => {
  await pool.query(
    'UPDATE usuarios SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3',
    [activo, modificadorId, userId],
  );
};

const resetPassword = async (userId, modificadorId, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  await pool.query(
    'UPDATE usuarios SET password_hash = $1, requiere_cambio_password = true, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3',
    [hash, modificadorId, userId],
  );
};

module.exports = {
  loginUser,
  getUserProfile,
  updateUserProfile,
  registerUserAccess,
  getAllUsersList,
  toggleStatus,
  resetPassword,
};
