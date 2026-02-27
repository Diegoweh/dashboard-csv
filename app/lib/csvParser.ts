import { Campaign, DashboardData, DashboardMetrics } from './types';

export type CSVMapping = Record<string, number>;

export function parseCSVText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n').map(l =>
    l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
  );
  if (lines.length < 2) return { headers: [], rows: [] };
  return { headers: lines[0], rows: lines.slice(1).filter(r => r.some(c => c.trim())) };
}

const AUTO_PATTERNS: Record<string, string[]> = {
  campaign_name:      ['campaign name', 'campana', 'nombre'],
  amount_spent:       ['amount spent', 'gasto', 'importe', 'spend'],
  cpc_all:            ['cpc', 'cost per click'],
  ctr_link:           ['ctr (link)', 'ctr link', 'link ctr'],
  landing_page_views: ['landing page views', 'lpv'],
  impressions:        ['impressions', 'impresiones'],
  reach:              ['reach', 'alcance'],
  link_clicks:        ['link clicks', 'clics'],
  frequency:          ['frequency', 'frecuencia'],
  cpm:                ['cpm'],
};

export function autoDetectMapping(headers: string[]): CSVMapping {
  const mapping: CSVMapping = {};
  for (const [field, pats] of Object.entries(AUTO_PATTERNS)) {
    mapping[field] = headers.findIndex(h =>
      pats.some(p => h.toLowerCase().includes(p))
    );
  }
  return mapping;
}

function getVal(row: string[], idx: number): string | null {
  if (idx < 0 || idx >= row.length) return null;
  return row[idx] || null;
}

export function buildDashboardData(
  rows: string[][],
  mapping: CSVMapping,
  filename: string
): DashboardData {
  const campaigns: Campaign[] = rows.map(row => {
    const name   = getVal(row, mapping.campaign_name) || 'Sin nombre';
    const spend  = parseFloat((getVal(row, mapping.amount_spent)     || '').replace(/[$,]/g, '')) || 0;
    const cpc    = parseFloat((getVal(row, mapping.cpc_all)          || '').replace(/[$,]/g, '')) || null;
    const ctr    = parseFloat((getVal(row, mapping.ctr_link)         || '').replace('%', ''))     || null;
    const lpv    = parseInt  ((getVal(row, mapping.landing_page_views)|| '').replace(/,/g, ''))   || null;
    const imp    = parseInt  ((getVal(row, mapping.impressions)       || '').replace(/,/g, ''))   || null;
    const reach  = parseInt  ((getVal(row, mapping.reach)             || '').replace(/,/g, ''))   || null;
    const lc     = parseInt  ((getVal(row, mapping.link_clicks)       || '').replace(/,/g, ''))   || null;
    const freq   = parseFloat( getVal(row, mapping.frequency)         || '')                       || null;
    const cpm    = parseFloat((getVal(row, mapping.cpm)               || '').replace(/[$,]/g, '')) || null;
    const cpli   = spend && lpv ? spend / lpv : null;
    const action = !cpli ? 'Estable' : cpli > 10 ? 'Pausar HOY' : cpli > 6 ? 'Optimizar' : cpli < 3.5 ? 'Escalar' : 'Estable';
    return { name, spend, cpc, ctr, lpv, freq, cpm, impressions: imp, reach, link_clicks: lc, intent: lpv, cpli, action };
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
    lpv:           totIntent,
    cpc:           totSpend && totLC      ? totSpend / totLC              : null,
    cpm:           totSpend && totImp     ? (totSpend / totImp) * 1000    : null,
    spend:         totSpend,
    freq:          totImp   && totReach   ? totImp / totReach             : null,
    cpm_reach:     null,
    impressions:   totImp,
    reach:         totReach,
    link_clicks:   totLC,
    lpv_total:     totLPV,
    intent_clicks: totIntent,
  };

  return {
    clientName: filename.replace('.csv', ''),
    period:     'CSV importado',
    metrics,
    campaigns,
  };
}
