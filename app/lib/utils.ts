export function fmt$(v: number | null | undefined): string {
  if (v === undefined || v === null) return '--';
  return '$' + Number(v).toFixed(2);
}

export function fmtPct(v: number | null | undefined): string {
  if (v === undefined || v === null) return '--';
  return Number(v).toFixed(1) + '%';
}

export function fmtK(v: number | null | undefined): string {
  if (v === undefined || v === null) return '--';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
  return Number(v).toLocaleString();
}

export function fmtClass(f = ''): string {
  const v = (f || '').toLowerCase();
  if (v.includes('video')) return 'fmt-video';
  if (v.includes('imagen') || v.includes('image') || v.includes('foto')) return 'fmt-imagen';
  if (v.includes('carrusel') || v.includes('carousel')) return 'fmt-carrusel';
  if (v.includes('historia') || v.includes('story')) return 'fmt-historia';
  if (v.includes('reel')) return 'fmt-reel';
  return 'fmt-default';
}

export function getActionChipClass(action: string): string {
  const map: Record<string, string> = {
    Escalar: 'chip-scale',
    'Pausar HOY': 'chip-pause',
    Optimizar: 'chip-optimize',
    Estable: 'chip-stable',
  };
  return map[action] || 'chip-stable';
}
