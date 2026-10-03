import { CutPhotoOption } from '../defaultData.ts';

const CUSTOM_PHOTOS_KEY = 'acougue_custom_cut_photos_v1';

/**
 * Resizes and compresses an image file to a lightweight data URL
 * so it saves efficiently in storage and loads instantly on the TV.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Falha ao processar arquivo de imagem.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Loads custom photos uploaded by the user from localStorage.
 */
export function getStoredCustomPhotos(): CutPhotoOption[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PHOTOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Saves a new custom photo to localStorage and returns the photo object.
 */
export function addStoredCustomPhoto(name: string, dataUrl: string): CutPhotoOption {
  const current = getStoredCustomPhotos();
  const newPhoto: CutPhotoOption = {
    id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: name.trim() || 'Foto Enviada',
    url: dataUrl,
    isCustom: true,
  };

  const updated = [newPhoto, ...current];
  try {
    localStorage.setItem(CUSTOM_PHOTOS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Storage limit reached, removing oldest photo:', err);
    // Keep at most 10 custom photos if quota is tight
    const trimmed = updated.slice(0, 10);
    localStorage.setItem(CUSTOM_PHOTOS_KEY, JSON.stringify(trimmed));
  }

  return newPhoto;
}

/**
 * Removes a custom photo from storage.
 */
export function removeStoredCustomPhoto(id: string): void {
  const current = getStoredCustomPhotos();
  const filtered = current.filter((p) => p.id !== id);
  try {
    localStorage.setItem(CUSTOM_PHOTOS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
