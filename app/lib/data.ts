import { DashboardData, Industry, IndustryBenchmark, CampaignMode } from './types';

export const CLAUDE_MODEL = 'claude-sonnet-4-6';

// ── INDUSTRY BENCHMARKS (MXN) ─────────────────────────────────────────────
// Single source of truth for: KPI badges, campaign actions, alerts, scorecard, AI prompts
export const INDUSTRY_BENCHMARKS: Record<Industry, IndustryBenchmark> = {
  'Atracción / Entretenimiento': { scale: 4, stable: 7, optimize: 12, pause: 12, ctrMin: 2.0, freqAlert: 2.5, lpvMin: 85, cpmAlert: 80, cprScale: 8, cprStable: 15, cprPause: 30, msgRateMin: 20 },
  'Hotel / Hospedaje':           { scale: 8, stable: 12, optimize: 18, pause: 18, ctrMin: 1.8, freqAlert: 3.0, lpvMin: 80, cpmAlert: 100, cprScale: 12, cprStable: 25, cprPause: 50, msgRateMin: 15 },
  'Turismo / Atracción':         { scale: 5, stable: 8, optimize: 14, pause: 14, ctrMin: 2.0, freqAlert: 2.5, lpvMin: 85, cpmAlert: 80, cprScale: 8, cprStable: 15, cprPause: 30, msgRateMin: 20 },
  'Food & Lifestyle':            { scale: 3, stable: 6, optimize: 10, pause: 10, ctrMin: 2.5, freqAlert: 2.5, lpvMin: 85, cpmAlert: 60, cprScale: 5, cprStable: 12, cprPause: 25, msgRateMin: 25 },
  'Healthcare / Salud':          { scale: 10, stable: 18, optimize: 30, pause: 30, ctrMin: 0.5, freqAlert: 3.0, lpvMin: 80, cpmAlert: 120, cprScale: 15, cprStable: 50, cprPause: 80, msgRateMin: 10 },
  'Ecommerce':                   { scale: 5, stable: 8, optimize: 14, pause: 14, ctrMin: 2.0, freqAlert: 2.5, lpvMin: 85, cpmAlert: 70, cprScale: 8, cprStable: 15, cprPause: 30, msgRateMin: 20 },
  'Bienes Raíces':               { scale: 15, stable: 25, optimize: 45, pause: 45, ctrMin: 1.2, freqAlert: 3.5, lpvMin: 75, cpmAlert: 150, cprScale: 20, cprStable: 50, cprPause: 100, msgRateMin: 10 },
  'B2B / Servicios':             { scale: 12, stable: 20, optimize: 35, pause: 35, ctrMin: 1.5, freqAlert: 3.0, lpvMin: 80, cpmAlert: 100, cprScale: 15, cprStable: 35, cprPause: 70, msgRateMin: 12 },
  'Retail / Comercio':           { scale: 4, stable: 7, optimize: 12, pause: 12, ctrMin: 2.0, freqAlert: 2.5, lpvMin: 85, cpmAlert: 70, cprScale: 6, cprStable: 12, cprPause: 25, msgRateMin: 20 },
  'Otro':                        { scale: 5, stable: 8, optimize: 14, pause: 14, ctrMin: 2.0, freqAlert: 2.5, lpvMin: 85, cpmAlert: 80, cprScale: 10, cprStable: 20, cprPause: 40, msgRateMin: 15 },
};

export function getBenchmark(industry: Industry): IndustryBenchmark {
  return INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['Otro'];
}

// ── CAMPAIGN ACTION FORMULA (4 factors) ───────────────────────────────────
// Traffic mode: uses CPL-I + freq + CTR + LPV rate
// Messages mode: uses CPR + freq + CTR + msg rate
export function calcAction(
  cpli: number | null,
  freq: number | null,
  ctr: number | null,
  lpvRate: number | null,
  bench: IndustryBenchmark,
  mode: CampaignMode = 'traffic',
  cpr: number | null = null,
  msgRate: number | null = null,
): string {
  const f = freq ?? 0;
  const ct = ctr ?? 0;

  if (mode === 'messages') {
    const r = cpr ?? 999;
    const mr = msgRate ?? 0;
    const cprS = bench.cprScale ?? 15;
    const cprSt = bench.cprStable ?? 50;
    const cprP = bench.cprPause ?? 80;
    const mrMin = bench.msgRateMin ?? 10;

    // PAUSAR — cost per result way too high or frequency burned out
    if (r > cprP * 2 || f > 4.5) return 'Pausar HOY';
    // ESCALAR — low CPR + healthy freq + decent CTR + good message rate
    if (r < cprS && f < 2.5 && mr > mrMin) return 'Escalar';
    // OPTIMIZAR — any one condition triggers
    if (r > cprSt || f > bench.freqAlert || (mr < mrMin && mr > 0)) return 'Optimizar';
    return 'Estable';
  }

  // Traffic mode (original logic)
  const c = cpli ?? 999;
  const lp = lpvRate ?? 100;

  // PAUSAR — any one condition triggers
  if (c > bench.pause * 2 || f > 4.5 || (ct < 0.8 && ct > 0)) return 'Pausar HOY';
  // ESCALAR — all 4 conditions must be met
  if (c < bench.scale && f < 2.5 && ct > bench.ctrMin && lp > 80) return 'Escalar';
  // OPTIMIZAR — any one condition triggers
  if (c > bench.stable || f > bench.freqAlert || (ct < bench.ctrMin && ct > 0)) return 'Optimizar';

  return 'Estable';
}

// ── WINNER SCORE (weighted by spend) ──────────────────────────────────────
export function calcWinnerScore(ctr: number, cpli: number, freq: number, spend: number): number {
  return (ctr / Math.max(cpli, 0.01)) * (freq < 2.5 ? 1.2 : 0.8) * Math.log10(Math.max(spend, 10));
}

// ── INDUSTRIES LIST ───────────────────────────────────────────────────────
export const INDUSTRIES: Industry[] = [
  'Atracción / Entretenimiento',
  'Hotel / Hospedaje',
  'Turismo / Atracción',
  'Food & Lifestyle',
  'Healthcare / Salud',
  'Ecommerce',
  'Bienes Raíces',
  'B2B / Servicios',
  'Retail / Comercio',
  'Otro',
];

// ── DEMO DATA ─────────────────────────────────────────────────────────────
export const DEMO_DATA: DashboardData = {
  clientName: 'DEMO',
  period: 'Demo · 15 días',
  industry: 'Ecommerce',
  mode: 'traffic',
  metrics: {
    cpli: 3.20, cpr: null, ctr: 2.7, lpv_rate: 78, msg_rate: null, lpv: 1840,
    cpc: 1.74, cpm: 11.40, spend: 3200, freq: 2.1, cpm_reach: 18.60,
    impressions: 280000, reach: 142000, link_clicks: 7560,
    lpv_total: 5897, intent_clicks: 1840, total_results: null,
  },
  campaigns: [
    { name: 'Prosp_Familias_Video',     spend: 820, cpc: 1.60, cpli: 3.10, cpr: null, ctr: 3.1, lpv: 512, freq: 1.6, intent: 179, results: null, action: 'Escalar',    cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Retarg_Visita_Producto',   spend: 210, cpc: 1.05, cpli: 1.80, cpr: null, ctr: 4.2, lpv: 200, freq: 2.9, intent: 70,  results: null, action: 'Optimizar',  cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Prosp_Broad_Carousel',     spend: 640, cpc: 2.80, cpli: 5.40, cpr: null, ctr: 2.4, lpv: 229, freq: 1.9, intent: 80,  results: null, action: 'Estable',    cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'LAL_1pct_Compradores',     spend: 590, cpc: 3.10, cpli: 6.20, cpr: null, ctr: 2.1, lpv: 190, freq: 2.0, intent: 67,  results: null, action: 'Optimizar',  cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Prosp_Broad_Static_Image', spend: 480, cpc: 4.80, cpli: 9.60, cpr: null, ctr: 1.1, lpv: 100, freq: 4.1, intent: 35,  results: null, action: 'Pausar HOY', cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Retarg_Homepage',          spend: 460, cpc: 2.30, cpli: 7.10, cpr: null, ctr: 2.6, lpv: 200, freq: 3.8, intent: 70,  results: null, action: 'Optimizar',  cpm: null, impressions: null, reach: null, link_clicks: null },
  ],
};

// ── COL FIELDS for CSV mapping ────────────────────────────────────────────
export const COL_FIELDS = [
  { key: 'campaign_name',        label: 'Nombre de Campaña',           required: true  },
  { key: 'amount_spent',         label: 'Gasto (Importe gastado)',     required: true  },
  { key: 'link_clicks',          label: 'Clics en el enlace',         required: false },
  { key: 'landing_page_views',   label: 'Visitas a la página (LPV)',  required: false },
  { key: 'impressions',          label: 'Impresiones',                required: false },
  { key: 'reach',                label: 'Alcance',                    required: false },
  { key: 'frequency',            label: 'Frecuencia',                 required: false },
  { key: 'ctr_link',             label: 'CTR (Enlace)',               required: false },
  { key: 'cpc_all',              label: 'CPC (Clic en el enlace)',    required: false },
  { key: 'cpm',                  label: 'CPM',                        required: false },
  { key: 'add_to_cart',          label: 'Add to Cart / Intención',    required: false },
  { key: 'results',              label: 'Resultados (Mensajes)',      required: false },
  { key: 'cost_per_result',      label: 'Coste por resultados',       required: false },
  { key: 'result_indicator',     label: 'Indicador de resultado',     required: false },
];

// ── FEEDBACK LOOP: Dashboard → Calendario ──────────────────────────────────
// Saves key insights from dashboard analysis to localStorage
// The calendario module reads these to pre-fill the briefing
export interface DashboardInsights {
  clientName: string;
  industry: Industry;
  period: string;
  bestFormat: string;
  bestCampaign: string;
  bestCPLI: number;
  avgCTR: number;
  avgFreq: number;
  lpvRate: number;
  hasRetargeting: boolean;
  topAction: string;
  savedAt: string;
}

export function saveDashboardInsights(data: DashboardData): void {
  const campaigns = data.campaigns;
  const fmtCounts: Record<string, { count: number; ctr: number }> = {};
  campaigns.forEach(c => {
    const fmt = c.name.toLowerCase().includes('video') || c.name.toLowerCase().includes('reel') ? 'Reel/Video'
      : c.name.toLowerCase().includes('carousel') || c.name.toLowerCase().includes('carrusel') ? 'Carrusel'
      : c.name.toLowerCase().includes('static') || c.name.toLowerCase().includes('image') ? 'Imagen estática'
      : 'Otro';
    if (!fmtCounts[fmt]) fmtCounts[fmt] = { count: 0, ctr: 0 };
    fmtCounts[fmt].count++;
    fmtCounts[fmt].ctr += c.ctr ?? 0;
  });
  const bestFmt = Object.entries(fmtCounts).sort((a, b) => (b[1].ctr / b[1].count) - (a[1].ctr / a[1].count))[0];
  const bestCamp = data.mode === 'messages'
    ? [...campaigns].sort((a, b) => (a.cpr ?? 999) - (b.cpr ?? 999))[0]
    : [...campaigns].sort((a, b) => (a.cpli ?? 999) - (b.cpli ?? 999))[0];

  const insights: DashboardInsights = {
    clientName: data.clientName,
    industry: data.industry,
    period: data.period,
    bestFormat: bestFmt ? bestFmt[0] : 'Sin datos',
    bestCampaign: bestCamp?.name ?? 'Sin datos',
    bestCPLI: data.mode === 'messages' ? (bestCamp?.cpr ?? 0) : (bestCamp?.cpli ?? 0),
    avgCTR: data.metrics.ctr ?? 0,
    avgFreq: data.metrics.freq ?? 0,
    lpvRate: data.metrics.lpv_rate ?? 0,
    hasRetargeting: campaigns.some(c => c.name.toLowerCase().match(/retarg|rmk/)),
    topAction: campaigns.filter(c => c.action === 'Escalar').length > 0 ? 'Escalar' : 'Optimizar',
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem('proy_dashboard_insights', JSON.stringify(insights));
}

export function getDashboardInsights(): DashboardInsights | null {
  try {
    const raw = localStorage.getItem('proy_dashboard_insights');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
