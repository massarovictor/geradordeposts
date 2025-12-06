import { supabase } from './supabaseClient';

const BUCKET = 'cards-media';

const randomName = (prefix: string, extension = 'bin') =>
  `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

export const dataUrlToBlob = (dataUrl: string): Blob | null => {
  const parts = dataUrl.split(',');
  if (parts.length !== 2) return null;
  const meta = parts[0];
  const base64 = parts[1];
  const match = /data:(.*?);base64/.exec(meta);
  const mime = match?.[1] || 'application/octet-stream';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

/**
 * Converts an image Blob/File to WebP format for optimized storage
 * Returns the original if conversion fails or for non-image types
 */
export async function convertToWebP(file: File | Blob, quality = 0.85): Promise<Blob> {
  // Skip if not an image
  const mime = (file as File).type || '';
  if (!mime.startsWith('image/')) return file;

  // Skip if already WebP
  if (mime === 'image/webp') return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Extracts the storage path from a Supabase public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/cards-media/students/123.png
 * Returns: students/123.png
 */
const extractPathFromUrl = (publicUrl: string): string | null => {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
};

/**
 * Deletes an image from Supabase storage given its public URL
 */
export async function deleteImageFromStorage(publicUrl: string): Promise<boolean> {
  if (!supabase || !publicUrl) return false;

  // Skip if it's a data URL (not uploaded to storage)
  if (publicUrl.startsWith('data:')) return false;

  const filePath = extractPathFromUrl(publicUrl);
  if (!filePath) {
    console.warn('Could not extract path from URL:', publicUrl);
    return false;
  }

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

  if (error) {
    console.warn('Erro ao deletar imagem do Storage:', error.message);
    return false;
  }

  return true;
}

/**
 * Uploads an image to Supabase storage, converting to WebP for optimization
 */
export async function uploadImageToStorage(file: File | Blob, pathPrefix: string): Promise<string | null> {
  if (!supabase) return null;

  // Convert to WebP for optimized storage
  const webpBlob = await convertToWebP(file);
  const filePath = randomName(pathPrefix, 'webp');

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, webpBlob, { cacheControl: '3600', upsert: false, contentType: 'image/webp' });

  if (error) {
    console.warn('Erro ao subir imagem no Storage:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl ?? null;
}
