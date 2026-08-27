import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

async function dataUrlToFile(dataUrl, filename) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/png' });
}

export default function SharePreviewModal({ dataUrl, filename, onClose }) {
  const { t } = useLanguage();
  const canUseShareApi = typeof navigator !== 'undefined' && !!navigator.canShare;

  // Called directly from this button's own click — that's what makes it a
  // fresh user gesture, unlike the old code that tried to call share() from
  // deep inside an async render chain.
  async function handleShareClick() {
    try {
      const file = await dataUrlToFile(dataUrl, filename);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: t.shareImageTitle });
        onClose();
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
    }
  }

  return (
    <Modal title={t.shareResultButton} onClose={onClose}>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <img
          src={dataUrl}
          alt={filename}
          style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          <a href={dataUrl} download={filename} className="btn btn-primary">
            {t.saveImageButton}
          </a>
          {canUseShareApi && (
            <Button variant="secondary" onClick={handleShareClick}>
              {t.shareResultButton}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
