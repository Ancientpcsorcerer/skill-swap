// Tiny ID generator (not crypto-secure; for demo trades and relations)
export const newId = (prefix = 'id'): string =>
  `${prefix}.${Math.random().toString(36).slice(2, 10)}`;

export const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
