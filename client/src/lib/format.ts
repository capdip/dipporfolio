export function formatDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateRange(start?: string, end?: string): string {
  const from = formatDate(start);
  const to = end ? formatDate(end) : 'Present';
  if (!from) return to;
  return `${from} — ${to}`;
}

export function excerpt(text: string | undefined, max = 160): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function initials(name?: string | null): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function isInternalUrl(url?: string): boolean {
  return typeof url === 'string' && url.startsWith('/');
}

export function proficiencyPercent(proficiency?: string): number {
  switch ((proficiency ?? '').toLowerCase()) {
    case 'expert':
    case 'native':
      return 95;
    case 'advanced':
    case 'fluent':
      return 80;
    case 'intermediate':
    case 'proficient':
      return 60;
    case 'beginner':
    case 'basic':
      return 35;
    default:
      return 50;
  }
}
