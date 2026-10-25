/** "now", "5m", "3h", "2d", "4mo", "1y" — same compact style as the demo. */
export function timeAgo(value?: string): string {
  if (!value) return '';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}
