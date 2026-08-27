import Card from './Card.jsx';

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="modal">
        <div className="modal__head">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button aria-label="Close" className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
