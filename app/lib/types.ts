export interface Campaign {
  name: string;
  spend: number;
  cpc: number | null;
  cpli: number | null;
  ctr: number | null;
  lpv: number | null;
  freq: number | null;
  cpm: number | null;
  impressions: number | null;
  reach: number | null;
  link_clicks: number | null;
  intent: number | null;
  action: string;
  _idx?: number;
  score?: number;
}

export interface DashboardMetrics {
  cpli: number | null;
  ctr: number | null;
  lpv_rate: number | null;
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
}

export interface DashboardData {
  clientName: string;
  period: string;
  industry: Industry;
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
  scale: number;      // CPL-I below this = Escalar
  stable: number;     // CPL-I below this = Estable
  optimize: number;   // CPL-I below this = Optimizar
  pause: number;      // CPL-I above this = Pausar
  ctrMin: number;     // CTR minimum for industry (%)
  freqAlert: number;  // Frequency alert threshold
  lpvMin: number;     // LPV rate minimum (%)
  cpmAlert: number;   // CPM alert threshold (MXN)
}

export type View = 'upload' | 'dashboard';
export type Theme = 'light' | 'dark';
export type ModalTab = 'diagnostico' | 'audiencia' | 'ideas';
