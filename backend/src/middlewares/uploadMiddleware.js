const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Genera un middleware de Multer configurado para una carpeta específica.
 * @param {string} folderName Nombre de la carpeta dentro de 'backend/uploads/'
 * @param {string} prefix Prefijo para el nombre del archivo (ej: 'perfil', 'factura')
 */
const createUploadMiddleware = (folderName, prefix = 'file') => {
  const uploadDir = path.join(__dirname, '../../uploads', folderName);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  // Límite opcional de 10MB por seguridad
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
};

module.exports = createUploadMiddleware;
