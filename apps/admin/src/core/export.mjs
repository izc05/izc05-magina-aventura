function scalar(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function cell(value) {
  const text = scalar(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"','""')}"`;
  return text;
}

export function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = [...new Set(rows.flatMap((row)=>Object.keys(row)))];
  const lines = [headers.map(cell).join(',')];
  for (const row of rows) lines.push(headers.map((header)=>cell(row[header])).join(','));
  return `${lines.join('\r\n')}\r\n`;
}
