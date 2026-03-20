const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Almacenamiento temporal en RAM
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

/**
 * Función para subir a Cloudinary
 * @param {Buffer} fileBuffer Buffer del archivo
 * @param {string} folder Carpeta destino en Cloudinary
 */
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `almacen_grupoSP/${folder}`,
        resource_type: 'auto', // Detecta si es PDF o Imagen automáticamente
        public_id: `${Date.now()}-${uuidv4()}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // Retorna la URL https
      },
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary,
};
