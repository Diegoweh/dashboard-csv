import { Campaign, CampaignMode, DashboardData, DashboardMetrics, Industry } from './types';
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
// Each field has an array of patterns. We match headers case-insensitively.
// Priority patterns (exact-ish matches) come first; fuzzy ones last.
const AUTO_PATTERNS: Record<string, string[]> = {
  campaign_name:      ['campaign name', 'nombre de la campaña', 'nombre de campaña', 'nombre del conjunto de anuncios', 'ad set name', 'ad name', 'nombre del anuncio'],
  amount_spent:       ['amount spent', 'importe gastado', 'cantidad gastada', 'gasto', 'spend'],
  cpc_all:            ['coste por clic en el enlace', 'cpc (coste por clic en el enlace)', 'cpc (link click)', 'cpc (all)', 'cost per link click', 'cost per click', 'costo por clic en el enlace', 'costo por clic'],
  ctr_link:           ['ctr (tasa de clics en el enlace)', 'tasa de clics en el enlace', 'ctr (link click-through rate)', 'ctr (link)', 'link ctr', 'porcentaje de clics en el enlace', 'ctr enlace'],
  landing_page_views: ['visitas a la página de destino', 'landing page views', 'visualizaciones de la página de destino', 'website landing page views', 'lpv'],
  impressions:        ['impresiones', 'impressions'],
  reach:              ['alcance', 'reach'],
  link_clicks:        ['clics en el enlace', 'link clicks', 'clics en enlace', 'clicks en el enlace', 'outbound clicks'],
  frequency:          ['frecuencia', 'frequency'],
  cpm:                ['cpm (coste por 1000 impresiones)', 'coste por 1000 impresiones', 'coste por 1,000 impresiones', 'cpm (coste por 1.000 impresiones)', 'costo por 1,000 impresiones', 'costo por 1.000 impresiones', 'cpm'],
  add_to_cart:        ['adds to cart', 'add to cart', 'agregar al carrito', 'initiate checkout', 'inicios de pago', 'purchase', 'compras'],
  results:            ['resultados', 'results', 'mensajes enviados', 'messaging conversations started', 'conversaciones', 'leads'],
  cost_per_result:    ['coste por resultados', 'coste por resultado', 'cost per result', 'costo por resultado', 'costo por resultados'],
  result_indicator:   ['indicador de resultado', 'result indicator', 'result type', 'tipo de resultado'],
};

export function autoDetectMapping(headers: string[]): CSVMapping {
  const mapping: CSVMapping = {};
  const usedIndices = new Set<number>();
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Pass 1: exact match (normalized header === pattern)
  for (const [field, pats] of Object.entries(AUTO_PATTERNS)) {
    const idx = normalizedHeaders.findIndex((h, i) =>
      !usedIndices.has(i) && pats.some(p => h === p)
    );
    if (idx >= 0) { mapping[field] = idx; usedIndices.add(idx); }
  }

  // Pass 2: contains match for remaining unmapped fields
  for (const [field, pats] of Object.entries(AUTO_PATTERNS)) {
    if (mapping[field] !== undefined && mapping[field] >= 0) continue;
    const idx = normalizedHeaders.findIndex((h, i) =>
      !usedIndices.has(i) && pats.some(p => h.includes(p))
    );
    if (idx >= 0) { mapping[field] = idx; usedIndices.add(idx); }
    else { mapping[field] = -1; }
  }

  // Pass 3: special fallback — if link_clicks not found, try any header containing just "clics"
  // but NOT if it was already assigned to cpc or ctr
  if (mapping.link_clicks < 0) {
    const idx = normalizedHeaders.findIndex((h, i) =>
      !usedIndices.has(i) && (h.includes('clic') || h.includes('click')) && !h.includes('cpc') && !h.includes('ctr') && !h.includes('coste') && !h.includes('cost') && !h.includes('tasa')
    );
    if (idx >= 0) { mapping.link_clicks = idx; usedIndices.add(idx); }
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

// ── DETECT CAMPAIGN MODE ──────────────────────────────────────────────────
// Uses "Indicador de resultado" column (if present) for accurate detection.
// Messaging indicators: "messaging", "conversation", "onsite_conversion.messaging"
// Traffic indicators: "link_click", "landing_page_view", "reach", "post_engagement"
// Fallback: if no indicator column, check if CSV has LPV data → traffic
function detectMode(rows: string[][], mapping: CSVMapping): CampaignMode {
  const hasLPV = mapping.landing_page_views >= 0;
  const hasResults = mapping.results >= 0;
  const hasIndicator = mapping.result_indicator >= 0;

  if (!hasResults) return 'traffic';

  // ── Priority 1: Use "Indicador de resultado" column if available ──
  if (hasIndicator) {
    let msgIndicators = 0;
    let totalIndicators = 0;
    for (const row of rows) {
      const indicator = (getVal(row, mapping.result_indicator) || '').toLowerCase();
      if (!indicator) continue;
      totalIndicators++;
      if (indicator.includes('messaging') || indicator.includes('conversation') ||
          indicator.includes('mensaj') || indicator.includes('lead') ||
          indicator.includes('onsite_conversion.lead')) {
        msgIndicators++;
      }
    }
    // If majority of indicators are messaging-related → messages mode
    if (totalIndicators > 0 && msgIndicators > totalIndicators * 0.5) return 'messages';
    if (totalIndicators > 0) return 'traffic';
  }

  // ── Priority 2: No indicator column — use structural heuristic ──
  if (!hasLPV && hasResults) return 'messages';

  // Both LPV and Results mapped — check data density
  let lpvCount = 0, resCount = 0;
  for (const row of rows) {
    const lpvVal = parseInt2(getVal(row, mapping.landing_page_views));
    const resVal = parseInt2(getVal(row, mapping.results));
    if (lpvVal && lpvVal > 0) lpvCount++;
    if (resVal && resVal > 0) resCount++;
  }

  // Only switch to messages if there's clearly NO LPV data at all
  if (lpvCount === 0 && resCount > 0) return 'messages';
  return 'traffic';
}

// ── BUILD DASHBOARD DATA ─────────────────────────────────────────────────
export function buildDashboardData(
  rows: string[][],
  mapping: CSVMapping,
  filename: string,
  industry: Industry = 'Otro'
): DashboardData {
  const bench = getBenchmark(industry);
  const mode = detectMode(rows, mapping);

  const campaigns: Campaign[] = rows.map(row => {
    const name   = getVal(row, mapping.campaign_name) || 'Sin nombre';
    const spend  = parseNum(getVal(row, mapping.amount_spent)) || 0;
    const cpc    = parseNum(getVal(row, mapping.cpc_all));
    let   ctr    = parseNum(getVal(row, mapping.ctr_link));
    const lpv    = parseInt2(getVal(row, mapping.landing_page_views));
    const imp    = parseInt2(getVal(row, mapping.impressions));
    const reach  = parseInt2(getVal(row, mapping.reach));
    const lc     = parseInt2(getVal(row, mapping.link_clicks));
    const freq   = parseNum(getVal(row, mapping.frequency));
    const cpm    = parseNum(getVal(row, mapping.cpm));
    const atc    = parseInt2(getVal(row, mapping.add_to_cart));
    let   res    = parseInt2(getVal(row, mapping.results));
    const cprCsv = parseNum(getVal(row, mapping.cost_per_result));

    // If CTR comes from CSV as already a percentage (e.g. "1.5" meaning 1.5%)
    // Guard: if ctr > 100, it's likely raw clicks not a %, so ignore
    if (ctr !== null && ctr > 100) ctr = null;

    // If CTR not provided or invalid, calculate from link_clicks / impressions
    if ((ctr === null || ctr <= 0) && lc && imp && imp > 0) {
      ctr = (lc / imp) * 100;
    }

    // ── Guard: filter out non-messaging "results" in messages mode ──
    // When CSV mixes campaign objectives (awareness + messages), awareness
    // campaigns report reach as "Resultados". Detect and nullify these:
    // 1) Results ≈ reach (within 5%) → it's a reach result, not messaging
    // 2) Results > link_clicks × 5 with link_clicks > 0 → impossible for messages
    // 3) Results > 0 but link_clicks is 0/null → no click = no conversation
    if (mode === 'messages' && res !== null && res > 0) {
      const isReachResult = reach && reach > 0 && Math.abs(res - reach) / reach < 0.05;
      const isImpResult   = imp && imp > 0 && Math.abs(res - imp) / imp < 0.05;
      const wayMoreThanClicks = lc && lc > 0 && res > lc * 5;
      const noClicks = !lc || lc === 0;
      if (isReachResult || isImpResult || wayMoreThanClicks || noClicks) {
        res = null; // Not a messaging result — exclude from metrics
      }
    }

    const cpli   = spend && lpv ? spend / lpv : null;
    const cpr    = cprCsv ?? (spend && res ? spend / res : null);

    // Intent: use Add to Cart if mapped, otherwise estimate 35% of LPV
    const intent = atc ?? (lpv ? Math.round(lpv * 0.35) : null);
    // LPV rate for this campaign
    const lpvRate = lc && lpv ? (lpv / lc) * 100 : null;
    // Message rate: results / link clicks
    const msgRate = lc && res ? (res / lc) * 100 : null;

    // Action based on mode + 4-factor formula with industry benchmarks
    const action = mode === 'messages'
      ? calcAction(cpli, freq, ctr, lpvRate, bench, 'messages', cpr, msgRate)
      : calcAction(cpli, freq, ctr, lpvRate, bench, 'traffic');

    return { name, spend, cpc, ctr, lpv, freq, cpm, impressions: imp, reach, link_clicks: lc, intent, cpli, cpr, results: res, action };
  });

  const totSpend   = campaigns.reduce((a, c) => a + (c.spend         || 0), 0);
  const totImp     = campaigns.reduce((a, c) => a + (c.impressions   || 0), 0);
  const totReach   = campaigns.reduce((a, c) => a + (c.reach         || 0), 0);
  const totLC      = campaigns.reduce((a, c) => a + (c.link_clicks   || 0), 0);
  const totLPV     = campaigns.reduce((a, c) => a + (c.lpv           || 0), 0);
  const totIntent  = campaigns.reduce((a, c) => a + (c.intent        || 0), 0);
  const totResults = campaigns.reduce((a, c) => a + (c.results       || 0), 0);

  const metrics: DashboardMetrics = {
    cpli:          totSpend && totLPV       ? totSpend / totLPV             : null,
    cpr:           totSpend && totResults   ? totSpend / totResults         : null,
    ctr:           totLC    && totImp       ? (totLC / totImp) * 100       : null,
    lpv_rate:      totLC    && totLPV       ? (totLPV / totLC) * 100       : null,
    msg_rate:      totLC    && totResults   ? (totResults / totLC) * 100   : null,
    lpv:           totLPV || null,
    cpc:           totSpend && totLC        ? totSpend / totLC             : null,
    cpm:           totSpend && totImp       ? (totSpend / totImp) * 1000   : null,
    spend:         totSpend,
    freq:          totImp   && totReach     ? totImp / totReach            : null,
    cpm_reach:     totSpend && totReach     ? (totSpend / totReach) * 1000 : null,
    impressions:   totImp || null,
    reach:         totReach || null,
    link_clicks:   totLC || null,
    lpv_total:     totLPV || null,
    intent_clicks: totIntent || null,
    total_results: totResults || null,
  };

  return {
    clientName: filename.replace(/\.csv$/i, ''),
    period:     'CSV importado',
    industry,
    mode,
    metrics,
    campaigns,
  };
}
