export type CampaignMode = 'traffic' | 'messages';

export interface Campaign {
  name: string;
  spend: number;
  cpc: number | null;
  cpli: number | null;        // Cost per Landing Page View (traffic mode)
  cpr: number | null;         // Cost per Result/Message (messages mode)
  ctr: number | null;
  lpv: number | null;
  freq: number | null;
  cpm: number | null;
  impressions: number | null;
  reach: number | null;
  link_clicks: number | null;
  intent: number | null;
  results: number | null;     // Resultados (mensajes, conversaciones, etc.)
  action: string;
  _idx?: number;
  score?: number;
}

export interface DashboardMetrics {
  cpli: number | null;
  cpr: number | null;         // Cost per Result (messages mode)
  ctr: number | null;
  lpv_rate: number | null;
  msg_rate: number | null;    // Results / Link Clicks (messages mode)
  lpv: number | null;
  cpc: number | null;
  cpm: number | null;
  spend: number;
  freq: number | null;
  cpm_reach: number | null;
  impressions: number | null;
  reach: number | null;
  link_clicks: number | null;
  lpv_total: number | null;
  intent_clicks: number | null;
  total_results: number | null; // Total messages/results
}

export interface DashboardData {
  clientName: string;
  period: string;
  industry: Industry;
  mode: CampaignMode;         // 'traffic' or 'messages'
  metrics: DashboardMetrics;
  campaigns: Campaign[];
}

export type Industry =
  | 'Atracción / Entretenimiento'
  | 'Hotel / Hospedaje'
  | 'Turismo / Atracción'
  | 'Food & Lifestyle'
  | 'Healthcare / Salud'
  | 'Ecommerce'
  | 'Bienes Raíces'
  | 'B2B / Servicios'
  | 'Retail / Comercio'
  | 'Otro';

export interface IndustryBenchmark {
  scale: number;      // CPL-I below this = Escalar (traffic) or CPR scale (messages)
  stable: number;     // CPL-I below this = Estable
  optimize: number;   // CPL-I below this = Optimizar
  pause: number;      // CPL-I above this = Pausar
  ctrMin: number;     // CTR minimum for industry (%)
  freqAlert: number;  // Frequency alert threshold
  lpvMin: number;     // LPV rate minimum (%) — or msg_rate minimum in messages mode
  cpmAlert: number;   // CPM alert threshold (MXN)
  // Messaging-specific benchmarks (optional, used when mode = 'messages')
  cprScale?: number;     // Cost per result below this = Escalar
  cprStable?: number;    // Cost per result below this = Estable
  cprPause?: number;     // Cost per result above this = Pausar
  msgRateMin?: number;   // Minimum results/clicks rate (%)
}

export type View = 'upload' | 'dashboard';
export type Theme = 'light' | 'dark';
export type ModalTab = 'diagnostico' | 'audiencia' | 'ideas';
