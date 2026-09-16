function text(value) {
  return String(value ?? '').trim();
}

function sortOptions(options) {
  return [...options].sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base', numeric: true }));
}

function withId(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => text(row?.id));
}

export function routeOptions(rows) {
  return sortOptions(withId(rows).map((row) => {
    const code = text(row.route_code);
    const title = text(row.title) || text(row.slug) || 'Ruta sin nombre';
    return {
      value: text(row.id),
      label: code ? `${code} · ${title}` : title
    };
  }));
}

export function municipalityOptions(rows) {
  return sortOptions(withId(rows)
    .filter((row) => row.active !== false)
    .map((row) => ({
      value: text(row.id),
      label: text(row.name) || text(row.slug) || 'Municipio sin nombre'
    })));
}

export function partnerOptions(rows) {
  return sortOptions(withId(rows)
    .filter((row) => row.active !== false)
    .map((row) => ({
      value: text(row.id),
      label: text(row.name) || text(row.slug) || 'Partner sin nombre'
    })));
}

export function userOptions(rows) {
  return sortOptions(withId(rows).map((row) => {
    const name = text(row.display_name) || text(row.full_name) || text(row.name);
    const email = text(row.email);
    const label = name && email ? `${name} · ${email}` : name || email || 'Usuario sin nombre';
    return { value: text(row.id), label };
  }));
}
