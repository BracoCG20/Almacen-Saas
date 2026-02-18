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

  // 1. Mostrar archivo NUEVO seleccionado
  if (newFile) {
    const tempUrl = URL.createObjectURL(newFile);
    return (
      <div className='file-upload-wrapper'>
        <div className='file-preview-card'>
          <div className='file-info'>
            <FileText
              size={20}
              color='#7c3aed'
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
              <Eye size={18} />
            </a>
            <a
              href={tempUrl}
              download={newFile.name}
              title='Descargar'
              className='btn-icon download'
            >
              <Download size={18} />
            </a>
            <button
              type='button'
              onClick={handleClearNew}
              title='Eliminar Archivo'
              className='btn-icon delete'
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mostrar archivo EXISTENTE en base de datos
  if (existingUrl && !isExistingRemoved) {
    return (
      <div className='file-upload-wrapper'>
        <div className='file-preview-card'>
          <div className='file-info'>
            <FileText
              size={20}
              color='#10b981'
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
              <Eye size={18} />
            </a>
            <a
              href={existingUrl}
              download
              title='Descargar'
              className='btn-icon download'
            >
              <Download size={18} />
            </a>
            <button
              type='button'
              onClick={onExistingRemove}
              title='Eliminar Contrato'
              className='btn-icon delete'
            >
              <Trash2 size={18} />
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
        <UploadCloud size={20} />
        <span>Haz clic para seleccionar el contrato (PDF)</span>
      </button>
    </div>
  );
};

export default FileUploader;
