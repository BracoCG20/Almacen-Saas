//frontend/src/components/FileUploader/FileUploader.jsx
import { useRef } from 'react';
import { FileText, Eye, Download, Trash2, UploadCloud } from 'lucide-react';
import './FileUploader.scss';

const FileUploader = ({
  accept = '*',
  newFile,
  onFileSelect,
  onFileRemove,
  existingUrl,
  existingName,
  onExistingRemove,
  isExistingRemoved,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0], e);
    }
  };

  const handleClearNew = () => {
    onFileRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDownloadExisting = async (e) => {
    e.preventDefault(); // Evita que abra en nueva pestaña
    try {
      // Se obtiene el archivo en segundo plano
      const response = await fetch(existingUrl);
      const blob = await response.blob();

      // Se crea un link temporal en el navegador y dar "click"
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = existingName || 'Documento_Descargado.pdf';
      document.body.appendChild(a);
      a.click();

      // limpia la memoria
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error al forzar la descarga:', error);
      // Fallback: si por alguna razón falla, abre en pestaña normal
      window.open(existingUrl, '_blank');
    }
  };

  // 1. Mostrar archivo NUEVO seleccionado (Aún no subido al servidor)
  if (newFile) {
    const tempUrl = URL.createObjectURL(newFile);
    return (
      <div className='file-upload-wrapper'>
        <div className='file-preview-card'>
          <div className='file-info'>
            <FileText
              size={18}
              className='icon-new'
            />
            <span title={newFile.name}>{newFile.name}</span>
          </div>
          <div className='file-actions'>
            <a
              href={tempUrl}
              target='_blank'
              rel='noreferrer'
              title='Vista Previa'
              className='btn-icon preview'
            >
              <Eye size={16} />
            </a>
            {/* Para archivos nuevos (locales), el atributo download SÍ funciona directo */}
            <a
              href={tempUrl}
              download={newFile.name}
              title='Descargar'
              className='btn-icon download'
            >
              <Download size={16} />
            </a>
            <button
              type='button'
              onClick={handleClearNew}
              title='Eliminar Archivo'
              className='btn-icon delete'
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mostrar archivo EXISTENTE en la base de datos
  if (existingUrl && !isExistingRemoved) {
    return (
      <div className='file-upload-wrapper'>
        <div className='file-preview-card'>
          <div className='file-info'>
            <FileText
              size={18}
              className='icon-existing'
            />
            <span title={existingName || 'Archivo_Adjunto'}>
              {existingName || 'Archivo_Adjunto'}
            </span>
          </div>
          <div className='file-actions'>
            <a
              href={existingUrl}
              target='_blank'
              rel='noreferrer'
              title='Vista Previa'
              className='btn-icon preview'
            >
              <Eye size={16} />
            </a>
            {/* Aquí usamos el botón para forzar la descarga con JS */}
            <button
              type='button'
              onClick={handleDownloadExisting}
              title='Descargar'
              className='btn-icon download'
            >
              <Download size={16} />
            </button>
            <button
              type='button'
              onClick={onExistingRemove}
              title='Eliminar Contrato'
              className='btn-icon delete'
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Muestra BOTÓN CUSTOMIZADO si no hay archivo
  return (
    <div className='file-upload-wrapper empty-state'>
      <input
        type='file'
        accept={accept}
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button
        type='button'
        className='custom-upload-btn'
        onClick={handleButtonClick}
      >
        <UploadCloud size={18} />
        <span>Haz clic para seleccionar el contrato (PDF)</span>
      </button>
    </div>
  );
};

export default FileUploader;
