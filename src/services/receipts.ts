import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { uuid } from '../lib/ids';

// Fotos de movimientos: se guardan en el bucket PRIVADO 'receipts', en la
// carpeta del usuario (receipts/<userId>/...). El RLS del bucket solo deja
// que cada quien lea/escriba su propia carpeta. En la BD guardamos la RUTA
// del objeto (no un uri local), y para mostrarla se pide una URL firmada.
const BUCKET = 'receipts';

function extFromUri(uri: string): string {
  const clean = uri.split('?')[0];
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  const ext = (m?.[1] || 'jpg').toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

function contentTypeFor(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

// Una referencia "remota" es una ruta dentro del bucket (p.ej. "<uuid>/foto.jpg").
// Un uri local empieza con file://, content:// o /; uno http(s) es una URL ya usable.
function isLocalUri(ref: string): boolean {
  return ref.startsWith('file://') || ref.startsWith('content://') || ref.startsWith('/');
}
function isHttpUrl(ref: string): boolean {
  return ref.startsWith('http://') || ref.startsWith('https://');
}

/**
 * Sube cada foto local al bucket y devuelve la ruta del objeto. Si una ya es
 * ruta remota, la deja igual. Si una subida falla, conserva el uri local para
 * NO bloquear el guardado del movimiento (se puede reintentar luego).
 */
export async function uploadReceiptPhotos(userId: string, uris: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const uri of uris) {
    if (!isLocalUri(uri)) {
      out.push(uri); // ya es ruta de storage o una URL — no re-subir
      continue;
    }
    try {
      const ext = extFromUri(uri);
      const path = `${userId}/${uuid()}.${ext}`;
      const buffer = await new FileSystem.File(uri).arrayBuffer();
      const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
        contentType: contentTypeFor(ext),
        upsert: false,
      });
      if (error) throw error;
      out.push(path);
    } catch (e) {
      console.warn('No se pudo subir una foto a Storage; se conserva local:', e);
      out.push(uri);
    }
  }
  return out;
}

/** Borra del bucket las fotos (rutas remotas) de un movimiento eliminado. Best-effort. */
export async function deleteReceiptPhotos(refs: string[] | undefined): Promise<void> {
  if (!refs || !refs.length) return;
  const paths = refs.filter(r => !isLocalUri(r) && !isHttpUrl(r));
  if (!paths.length) return;
  try {
    await supabase.storage.from(BUCKET).remove(paths);
  } catch (e) {
    console.warn('No se pudieron borrar algunas fotos de Storage:', e);
  }
}

/**
 * Convierte rutas del bucket en URLs firmadas temporales para mostrarlas
 * (el bucket es privado). Deja intactos los uris locales / URLs http. Para
 * usar desde un visor de fotos del movimiento.
 */
export async function resolveReceiptUrls(refs: string[], expiresInSec = 3600): Promise<string[]> {
  const out: string[] = [];
  for (const ref of refs) {
    if (isLocalUri(ref) || isHttpUrl(ref)) {
      out.push(ref);
      continue;
    }
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ref, expiresInSec);
      if (error || !data?.signedUrl) throw error ?? new Error('sin URL firmada');
      out.push(data.signedUrl);
    } catch (e) {
      console.warn('No se pudo firmar la URL de una foto:', e);
      out.push(ref);
    }
  }
  return out;
}
