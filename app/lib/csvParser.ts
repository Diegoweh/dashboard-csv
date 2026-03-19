import { Campaign, DashboardData, DashboardMetrics, Industry } from './types';
import { calcAction, getBenchmark } from './data';

export type CSVMapping = Record<string, number>;

// ── PROPER CSV LINE PARSER (handles quoted fields with commas) ─────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

export function parseCSVText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1)
    .map(l => parseCSVLine(l))
    .filter(r => r.some(c => c.trim()));
  return { headers, rows };
}

// ── AUTO-DETECT PATTERNS (Spanish MX + English) ──────────────────────────
const AUTO_PATTERNS: Record<string, string[]> = {
  campaign_name:      ['campaign name', 'nombre de la campaña', 'nombre de campaña', 'campana', 'nombre'],
  amount_spent:       ['amount spent', 'importe gastado', 'cantidad gastada', 'gasto', 'importe', 'spend'],
  cpc_all:            ['cpc (all)', 'cpc', 'cost per click', 'costo por clic'],
  ctr_link:           ['ctr (link click-through rate)', 'ctr (link)', 'ctr link', 'link ctr', 'ctr (clics en el enlace)', 'porcentaje de clics en el enlace'],
  landing_page_views: ['landing page views', 'visualizaciones de la página de destino', 'vis. pág. destino', 'lpv'],
  impressions:        ['impressions', 'impresiones'],
  reach:              ['reach', 'alcance'],
  link_clicks:        ['link clicks', 'clics en el enlace', 'clics en enlace', 'clics'],
  frequency:          ['frequency', 'frecuencia'],
  cpm:                ['cpm', 'costo por 1,000 impresiones', 'costo por 1.000 impresiones'],
  add_to_cart:        ['adds to cart', 'add to cart', 'agregar al carrito', 'initiate checkout', 'inicios de pago', 'purchase', 'compras'],
};

export function autoDetectMapping(headers: string[]): CSVMapping {
  const mapping: CSVMapping = {};
  for (const [field, pats] of Object.entries(AUTO_PATTERNS)) {
    mapping[field] = headers.findIndex(h =>
      pats.some(p => h.toLowerCase().trim().includes(p))
    );
  }
  return mapping;
}

function getVal(row: string[], idx: number): string | null {
  if (idx === undefined || idx < 0 || idx >= row.length) return null;
  return row[idx]?.trim() || null;
}

function parseNum(val: string | null): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[$,%\s]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseInt2(val: string | null): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[$,%\s]/g, '').replace(/,/g, '');
  const n = parseInt(cleaned);
  return isNaN(n) ? null : n;
}

// ── BUILD DASHBOARD DATA ─────────────────────────────────────────────────
export function buildDashboardData(
  rows: string[][],
  mapping: CSVMapping,
  filename: string,
  industry: Industry = 'Otro'
): DashboardData {
  const bench = getBenchmark(industry);

  const campaigns: Campaign[] = rows.map(row => {
    const name   = getVal(row, mapping.campaign_name) || 'Sin nombre';
    const spend  = parseNum(getVal(row, mapping.amount_spent)) || 0;
    const cpc    = parseNum(getVal(row, mapping.cpc_all));
    const ctr    = parseNum(getVal(row, mapping.ctr_link));
    const lpv    = parseInt2(getVal(row, mapping.landing_page_views));
    const imp    = parseInt2(getVal(row, mapping.impressions));
    const reach  = parseInt2(getVal(row, mapping.reach));
    const lc     = parseInt2(getVal(row, mapping.link_clicks));
    const freq   = parseNum(getVal(row, mapping.frequency));
    const cpm    = parseNum(getVal(row, mapping.cpm));
    const atc    = parseInt2(getVal(row, mapping.add_to_cart));

    const cpli   = spend && lpv ? spend / lpv : null;
    // Intent: use Add to Cart if mapped, otherwise estimate 35% of LPV
    const intent = atc ?? (lpv ? Math.round(lpv * 0.35) : null);
    // LPV rate for this campaign
    const lpvRate = lc && lpv ? (lpv / lc) * 100 : null;
    // Action based on 4-factor formula with industry benchmarks
    const action = calcAction(cpli, freq, ctr, lpvRate, bench);

    return { name, spend, cpc, ctr, lpv, freq, cpm, impressions: imp, reach, link_clicks: lc, intent, cpli, action };
  });

  const totSpend  = campaigns.reduce((a, c) => a + (c.spend         || 0), 0);
  const totImp    = campaigns.reduce((a, c) => a + (c.impressions   || 0), 0);
  const totReach  = campaigns.reduce((a, c) => a + (c.reach         || 0), 0);
  const totLC     = campaigns.reduce((a, c) => a + (c.link_clicks   || 0), 0);
  const totLPV    = campaigns.reduce((a, c) => a + (c.lpv           || 0), 0);
  const totIntent = campaigns.reduce((a, c) => a + (c.intent        || 0), 0);

  const metrics: DashboardMetrics = {
    cpli:          totSpend && totIntent  ? totSpend / totIntent          : null,
    ctr:           totLC    && totImp     ? (totLC / totImp) * 100        : null,
    lpv_rate:      totLC    && totLPV     ? (totLPV / totLC) * 100        : null,
    lpv:           totLPV,
    cpc:           totSpend && totLC      ? totSpend / totLC              : null,
    cpm:           totSpend && totImp     ? (totSpend / totImp) * 1000    : null,
    spend:         totSpend,
    freq:          totImp   && totReach   ? totImp / totReach             : null,
    cpm_reach:     totSpend && totReach   ? (totSpend / totReach) * 1000  : null,
    impressions:   totImp,
    reach:         totReach,
    link_clicks:   totLC,
    lpv_total:     totLPV,
    intent_clicks: totIntent,
  };

  return {
    clientName: filename.replace(/\.csv$/i, ''),
    period:     'CSV importado',
    industry,
    metrics,
    campaigns,
  };
}
