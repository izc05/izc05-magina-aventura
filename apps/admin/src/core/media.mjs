export function normalizeMediaTags(input) {
  const values = Array.isArray(input) ? input : String(input ?? '').split(',');
  return [...new Set(values.map((value)=>String(value).trim().toLowerCase()).filter(Boolean))];
}

export function sanitizeMediaFilename(name) {
  return String(name ?? 'file')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9._-]/g,'-')
    .replace(/-+/g,'-');
}

export function buildMediaObjectKey(id, filename) {
  const safeId = String(id ?? '').replace(/[^a-zA-Z0-9._-]/g,'');
  if (!safeId) throw new Error('Identificador de archivo inválido');
  return `uploads/${safeId}-${sanitizeMediaFilename(filename)}`;
}
