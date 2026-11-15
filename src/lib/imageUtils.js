// Shrinks a data URL to at most maxDim on its longest side and re-encodes as
// JPEG, so phone photos (often several MB) upload fast and stay comfortably
// under the extractReceipt Cloud Function's request-size limit.
export function downscaleImageDataUrl(dataUrl, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unsupported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = dataUrl;
  });
}

// Cuts `crop` (percentages of the picture: { x, y, width, height }) out of a
// data URL and returns it as a JPEG no larger than maxDim on its longest
// side. Cropping from the ORIGINAL photo rather than the already-shrunk
// preview means the receipt keeps more pixels per letter, which is what makes
// a cropped scan more accurate, not just smaller.
export function cropImageDataUrl(dataUrl, crop, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sx = Math.round((crop.x / 100) * img.naturalWidth);
      const sy = Math.round((crop.y / 100) * img.naturalHeight);
      const sw = Math.max(1, Math.round((crop.width / 100) * img.naturalWidth));
      const sh = Math.max(1, Math.round((crop.height / 100) * img.naturalHeight));
      const scale = Math.min(1, maxDim / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unsupported'));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = dataUrl;
  });
}
