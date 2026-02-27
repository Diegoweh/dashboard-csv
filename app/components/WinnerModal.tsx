'use client';
import { useState, useEffect, useCallback } from 'react';
import { Campaign, DashboardData, ModalTab } from '../lib/types';
import { fmt$, fmtPct, fmtK, fmtClass } from '../lib/utils';
import { callClaude } from '../lib/claude';

interface Props {
  open: boolean;
  campaignIndex: number;
  data: DashboardData;
  apiKey: string;
  onClose: () => void;
}

type TabContent = React.ReactNode;
type TabState = { content: TabContent; loading: boolean; done: boolean };
const INIT_TAB: TabState = { content: null, loading: false, done: false };

export default function WinnerModal({ open, campaignIndex, data, apiKey, onClose }: Props) {
  const [activeTab, setActiveTab]   = useState<ModalTab>('diagnostico');
  const [tabs, setTabs]             = useState<Record<ModalTab, TabState>>({
    diagnostico: INIT_TAB, audiencia: INIT_TAB, ideas: INIT_TAB,
  });

  const campaign: Campaign | null = data.campaigns[campaignIndex] ?? null;

  const runAnalysis = useCallback(async (tab: ModalTab) => {
    if (!campaign) return;
    setTabs(prev => ({ ...prev, [tab]: { ...prev[tab], loading: true, done: false } }));

    const gm  = data.metrics;
    const all = data.campaigns;
    const ctx = `Campaña: "${campaign.name}"\nGasto: $${campaign.spend||0}\nCPL-I: $${(campaign.cpli||0).toFixed(2)} (bench <$5)\nCTR: ${(campaign.ctr||0).toFixed(1)}%\nCPC: $${(campaign.cpc||0).toFixed(2)}\nLPV: ${campaign.lpv||0}\nFrecuencia: ${(campaign.freq||0).toFixed(1)}x\nAcción: ${campaign.action}\nCuenta total: gasto $${gm.spend||0} CPL-I avg $${(gm.cpli||0).toFixed(2)} CTR ${(gm.ctr||0).toFixed(1)}%\nOtras campañas: ${all.filter(x=>x.name!==campaign.name).map(x=>x.name).join(', ')||'--'}`;

    const prompts: Record<ModalTab, string> = {
      diagnostico: `Analiza esta campaña de Meta Ads. Responde SOLO en JSON sin texto extra:\n{"performance":"...","hook":"...","cta":"...","audiencia":"...","urgencia":"..."}\nData:\n${ctx}`,
      audiencia:   `Analiza el perfil de audiencia. Responde SOLO en JSON:\n{"perfil":"...","tamanio":"...","calidad":"...","expansion":"...","fatiga":"..."}\nData:\n${ctx}`,
      ideas:       `Genera 3 ideas de ads para replicar el éxito. Responde SOLO en JSON:\n{"ideas":[{"titulo":"...","formato":"...","hook":"...","descripcion":"...","porque":"...","tags":["..."]},...]}\nData:\n${ctx}`,
    };

    const LABELS: Record<ModalTab, Record<string, string>> = {
      diagnostico: { performance:'Rendimiento', hook:'Hook & Formato creativo', cta:'CTA & Landing', audiencia:'Señales de audiencia', urgencia:'Vida útil estimada' },
      audiencia:   { perfil:'Perfil de audiencia', tamanio:'Tamaño estimado', calidad:'Calidad de señal', expansion:'Potencial de escala', fatiga:'Fatiga proyectada' },
      ideas:       {},
    };

    try {
      if (!apiKey) throw new Error('Configura tu Claude API key primero');
      let text = await callClaude(apiKey, prompts[tab]);
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      let parsed: Record<string, unknown> | null = null;
      try { parsed = JSON.parse(text); } catch { parsed = null; }

      let content: TabContent;

      if (tab === 'ideas' && parsed && Array.isArray((parsed as { ideas?: unknown[] }).ideas)) {
        const ideas = (parsed as { ideas: Record<string, unknown>[] }).ideas;
        content = (
          <div className="flex flex-col gap-3">
            {ideas.map((idea, i) => (
              <div key={i} className="idea-card relative bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 rounded-2xl p-5 overflow-hidden">
                <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-accent tracking-widest uppercase mb-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] mr-2 border ${fmtClass(String(idea.formato || ''))}`}>{String(idea.formato || 'Ad')}</span>
                  IDEA {i + 1}
                </div>
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 mb-2">{String(idea.titulo || '--')}</div>
                <div className="text-xs text-zinc-400 mb-2"><span className="font-[family-name:var(--font-roboto-mono)]">HOOK: </span><span className="italic text-zinc-500 dark:text-zinc-400">&ldquo;{String(idea.hook || '--')}&rdquo;</span></div>
                <div className="text-xs font-light text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">{String(idea.descripcion || '--')}</div>
                <div className="text-xs text-zinc-400 mb-3"><strong className="text-zinc-600 dark:text-zinc-300">Por qué funcionará:</strong> {String(idea.porque || '--')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(idea.tags as string[] || []).map((t, j) => (
                    <span key={j} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 border border-black/6 dark:border-white/6 text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } else if (parsed && (tab === 'diagnostico' || tab === 'audiencia')) {
        content = (
          <div className="space-y-5">
            {Object.entries(LABELS[tab]).map(([k, label]) =>
              parsed![k] ? (
                <div key={k}>
                  <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium tracking-widest uppercase text-zinc-400 mb-1.5 pb-1.5 border-b border-black/6 dark:border-white/6">{label}</div>
                  <div className="text-sm font-light text-zinc-600 dark:text-zinc-400 leading-relaxed">{String(parsed[k])}</div>
                </div>
              ) : null
            )}
          </div>
        );
      } else {
        content = <div className="text-sm font-light text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">{text}</div>;
      }
      setTabs(prev => ({ ...prev, [tab]: { content, loading: false, done: true } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setTabs(prev => ({ ...prev, [tab]: {
        content: (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
            <div className="text-sm font-medium text-accent mb-1">Error al conectar con Claude AI</div>
            <div className="text-xs text-zinc-500">{msg}</div>
          </div>
        ),
        loading: false, done: true,
      } }));
    }
  }, [campaign, data, apiKey]);

  // Reset tabs when campaign changes
  useEffect(() => {
    setTabs({ diagnostico: INIT_TAB, audiencia: INIT_TAB, ideas: INIT_TAB });
    setActiveTab('diagnostico');
  }, [campaignIndex]);

  // Auto-run first tab when modal opens
  useEffect(() => {
    if (open && campaign && !tabs.diagnostico.done && !tabs.diagnostico.loading) {
      runAnalysis('diagnostico');
    }
  }, [open, campaign]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (tab: ModalTab) => {
    setActiveTab(tab);
    if (!tabs[tab].done && !tabs[tab].loading) runAnalysis(tab);
  };

  if (!campaign) return null;

  const stats = [
    { label: 'GASTO',      val: '$' + Number(campaign.spend || 0).toLocaleString(), sub: 'período'       },
    { label: 'CPL-I',      val: fmt$(campaign.cpli),                                 sub: 'clic intención' },
    { label: 'CTR',        val: fmtPct(campaign.ctr),                               sub: 'meta >2%'       },
    { label: 'CPC LPV',    val: fmt$(campaign.cpc),                                 sub: 'costo visita'   },
    { label: 'FRECUENCIA', val: (campaign.freq || 0).toFixed(1) + 'x',              sub: (campaign.freq ?? 0) > 2.5 ? 'alta' : 'ok' },
    { label: 'LPV',        val: fmtK(campaign.lpv),                                 sub: 'visitas reales' },
  ];

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'diagnostico', label: 'Diagnóstico completo' },
    { id: 'audiencia',   label: 'Audiencia & contexto' },
    { id: 'ideas',       label: '3 Ideas para replicar' },
  ];

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-start justify-center py-10 px-4 overflow-y-auto bg-black/55 backdrop-blur-2xl transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-3xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/8 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 transition-transform duration-300 ${open ? 'modal-box-open' : 'modal-box-enter'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-pamber uppercase tracking-widest">⚡ AD Análisis</span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 tracking-tight">{campaign.name}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-400 hover:bg-red-50 hover:text-accent text-xs transition-colors">✕</button>
        </div>

        {/* Stats row */}
        <div className="flex border-b border-black/6 dark:border-white/6 overflow-x-auto">
          {stats.map(s => (
            <div key={s.label} className="flex-1 min-w-[90px] px-4 py-4 border-r border-black/6 dark:border-white/6 last:border-r-0">
              <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 uppercase tracking-widest mb-1.5">{s.label}</div>
              <div className="font-[family-name:var(--font-roboto-cond)] text-xl font-light text-zinc-800 dark:text-zinc-100 tracking-tight">{s.val}</div>
              <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-800/30 px-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`py-3 mr-6 text-sm whitespace-nowrap border-b-2 transition-all
                ${activeTab === t.id
                  ? 'border-accent text-zinc-800 dark:text-zinc-100 font-medium'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-normal'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="p-6 min-h-48">
          {tabs[activeTab].loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-600 border-t-accent rounded-full animate-spin-slow" />
              <p className="text-sm text-zinc-400">Analizando con Claude AI…</p>
            </div>
          ) : tabs[activeTab].done ? (
            tabs[activeTab].content
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-zinc-400">
              <p className="text-sm">Haz clic en la pestaña para generar el análisis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
