const RAW_TOKEN = /^[A-Za-z0-9._~-]{8,512}$/;

export function normalizeRedemptionToken(input) {
  const value = String(input ?? '').trim();
  if (!value) throw new Error('El QR está vacío');

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    let url;
    try { url = new URL(value); }
    catch { throw new Error('El QR no contiene una URL válida'); }
    const token = String(url.searchParams.get('token') ?? '').trim();
    if (!token) throw new Error('El QR no contiene token de canje');
    if (!RAW_TOKEN.test(token)) throw new Error('El token del QR no es válido');
    return token;
  }

  if (!RAW_TOKEN.test(value)) throw new Error('El token del QR no es válido');
  return value;
}

export function barcodeDetectorSupported() {
  return typeof globalThis.BarcodeDetector === 'function';
}
