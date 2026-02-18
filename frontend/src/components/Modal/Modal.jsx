import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.scss';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className='modal-overlay'
      onClick={onClose}
    >
      <div
        className='modal-container'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>{title}</h2>
          <button
            className='btn-close'
            onClick={onClose}
            aria-label='Cerrar modal'
          >
            <X size={24} />
          </button>
        </div>
        <div className='modal-body'>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
