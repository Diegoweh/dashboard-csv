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
  metrics: DashboardMetrics;
  campaigns: Campaign[];
}

export type View = 'upload' | 'dashboard';
export type Theme = 'light' | 'dark';
export type ModalTab = 'diagnostico' | 'audiencia' | 'ideas';
