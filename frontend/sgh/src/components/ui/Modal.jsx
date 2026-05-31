import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '480px' }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-box" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
