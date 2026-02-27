import { DashboardData } from './types';

export const CLAUDE_MODEL = 'claude-sonnet-4-6';

export const DEMO_DATA: DashboardData = {
  clientName: 'DEMO',
  period: 'Demo · 15 días',
  metrics: {
    cpli: 3.20, ctr: 2.7, lpv_rate: 78, lpv: 1840,
    cpc: 1.74, cpm: 11.40, spend: 3200, freq: 2.1, cpm_reach: 18.60,
    impressions: 280000, reach: 142000, link_clicks: 7560,
    lpv_total: 5897, intent_clicks: 1840,
  },
  campaigns: [
    { name: 'Prosp_Familias_Video',     spend: 820, cpc: 1.60, cpli: 3.10, ctr: 3.1, lpv: 512, freq: 1.6, intent: 265, action: 'Escalar',    cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Retarg_Visita_Producto',   spend: 210, cpc: 1.05, cpli: 1.80, ctr: 4.2, lpv: 200, freq: 2.9, intent: 117, action: 'Optimizar',  cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Prosp_Broad_Carousel',     spend: 640, cpc: 2.80, cpli: 5.40, ctr: 2.4, lpv: 229, freq: 1.9, intent: 118, action: 'Estable',    cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'LAL_1pct_Compradores',     spend: 590, cpc: 3.10, cpli: 6.20, ctr: 2.1, lpv: 190, freq: 2.0, intent:  95, action: 'Estable',    cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Prosp_Broad_Static_Image', spend: 480, cpc: 4.80, cpli: 9.60, ctr: 1.1, lpv: 100, freq: 4.1, intent:  50, action: 'Pausar HOY', cpm: null, impressions: null, reach: null, link_clicks: null },
    { name: 'Retarg_Homepage',          spend: 460, cpc: 2.30, cpli: 7.10, ctr: 2.6, lpv: 200, freq: 3.8, intent:  65, action: 'Optimizar',  cpm: null, impressions: null, reach: null, link_clicks: null },
  ],
};

export const COL_FIELDS = [
  { key: 'campaign_name',        label: 'Nombre de Campaña',     required: true },
  { key: 'amount_spent',         label: 'Gasto (Amount Spent)',   required: true },
  { key: 'cpc_all',              label: 'CPC (Link Clicks)'       },
  { key: 'ctr_link',             label: 'CTR (Enlace)'            },
  { key: 'landing_page_views',   label: 'Landing Page Views'      },
  { key: 'impressions',          label: 'Impresiones'             },
  { key: 'reach',                label: 'Alcance'                 },
  { key: 'link_clicks',          label: 'Link Clicks'             },
  { key: 'frequency',            label: 'Frecuencia'              },
  { key: 'cpm',                  label: 'CPM'                     },
];
