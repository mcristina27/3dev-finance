// Detecta si un error vino de falta de conexión (fetch falla antes de llegar
// al servidor). Sirve para mostrar un aviso amable de "sin conexión" en vez
// de un error genérico al guardar.
export function isNetworkError(e: unknown): boolean {
  if (!e) return false;
  const raw = typeof e === 'string' ? e : (e as any)?.message;
  if (!raw) return false;
  const msg = String(raw).toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('network error') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('could not connect') ||
    msg.includes('unable to resolve host') ||
    msg.includes('connection appears to be offline') ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  );
}
