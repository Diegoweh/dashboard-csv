'use client';
import { useState } from 'react';
import { DashboardData } from '../lib/types';
import { fmt$, fmtPct, fmtK, fmtClass, getActionChipClass } from '../lib/utils';
import { callClaude } from '../lib/claude';
import ChartsSection from './ChartsSection';

interface Props {
  data: DashboardData;
  apiKey: string;
  isDark: boolean;
  onOpenModal: (idx: number) => void;
  aiBodyRef?: React.RefObject<HTMLDivElement | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI SECTION
// ─────────────────────────────────────────────────────────────────────────────
function KPISection({ data }: { data: DashboardData }) {
  const m = data.metrics;
  const cpli = m.cpli ?? 0;
  const ctr  = m.ctr  ?? 0;
  const lpvR = m.lpv_rate ?? 0;
  const lpvV = m.lpv ?? m.intent_clicks ?? 0;
  const cpc  = m.cpc ?? 0;
  const cpm  = m.cpm ?? 0;
  const freq = m.freq ?? 0;

  const cpliBadge = cpli <= 0 ? { cls: 'badge-muted', label: '— Sin datos' }
    : cpli < 5 ? { cls: 'badge-green', label: '▼ Bajo benchmark' }
    : cpli < 8 ? { cls: 'badge-amber', label: '⚠ Monitorear' }
    : { cls: 'badge-red', label: '▲ Sobre benchmark' };

  const ctrBadge = ctr >= 3 ? { cls: 'badge-green', label: '▲ Excelente' }
    : ctr >= 2 ? { cls: 'badge-green', label: '✓ Sólido' }
    : ctr >= 1 ? { cls: 'badge-amber', label: '⚠ Bajo — Revisar creative' }
    : { cls: 'badge-red', label: '▼ Crítico' };

  const ctrDesc = ctr >= 3
    ? <>CTR de <strong>{fmtPct(ctr)}</strong> supera el benchmark. El creative está capturando atención. Buen momento para escalar.</>
    : ctr >= 2
    ? <>CTR de <strong>{fmtPct(ctr)}</strong> dentro del rango objetivo. Mantener y probar variantes.</>
    : ctr >= 1
    ? <>CTR de <strong>{fmtPct(ctr)}</strong> por debajo del benchmark de 2%. Revisar hook visual o copy de apertura.</>
    : <>CTR de <strong>{fmtPct(ctr)}</strong> es crítico. Pausar y renovar creative urgentemente.</>;

  const lpvBadge = lpvR >= 85 ? { cls: 'badge-green', label: '✓ Óptima' }
    : lpvR >= 70  ? { cls: 'badge-amber', label: '⚠ Monitorear' }
    : { cls: 'badge-red', label: '▼ Crítica — Fricción alta' };

  const lpvDesc = lpvR >= 85
    ? <>Tasa de <strong>{fmtPct(lpvR)}</strong> excelente. La página carga bien en mobile.</>
    : lpvR >= 70
    ? <>Tasa de <strong>{fmtPct(lpvR)}</strong> por debajo del objetivo de 85%. Revisar velocidad mobile.</>
    : <>Tasa de <strong>{fmtPct(lpvR)}</strong> crítica. <strong>Problema del sitio</strong>: auditar PageSpeed mobile urgente.</>;

  return (
    <section id="kpis" className="mb-8 fade-in">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">01</span>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">KPIs de Intención</h2>
        </div>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-3 py-1.5 rounded-full tracking-wide">◎ {data.period}</span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        {/* CPL-I main */}
        <div className={`kpi-card relative bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl p-5 transition-all hover:-translate-y-px hover:shadow-xl group overflow-hidden ${cpliBadge.cls !== 'badge-muted' ? 'kpi-card-main' : ''}`}>
          <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest mb-2.5">CPL-I · Costo por Clic Intención</div>
          <Badge variant={cpliBadge.cls}>{cpliBadge.label}</Badge>
          <div className={`font-[family-name:var(--font-roboto-cond)] text-4xl font-light tracking-[-2px] leading-none my-2 ${cpli > 0 && cpli < 5 ? 'text-accent' : 'text-zinc-800 dark:text-zinc-100'}`}>{fmt$(m.cpli)}</div>
          <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mb-1.5">E-comm &lt;$5 · Hotel &lt;$8</div>
          <div className="text-xs font-light text-zinc-400 leading-relaxed mt-3 pt-3 border-t border-black/6 dark:border-white/6">
            <strong className="text-zinc-600 dark:text-zinc-300">KPI principal</strong>: costo de llevar al usuario hasta el clic en compra/reserva.
          </div>
        </div>

        {/* CTR */}
        <KPICard label="CTR ENLACE" badge={ctrBadge} value={fmtPct(m.ctr)} sub="Meta >2%">
          {ctrDesc}
        </KPICard>

        {/* LPV Rate */}
        <KPICard label="TASA LPV / CLICKS" badge={lpvBadge} value={fmtPct(m.lpv_rate)} sub="Meta >85%">
          {lpvDesc}
        </KPICard>

        {/* LPV Volume */}
        <KPICard
          label="VOLUMEN LPV"
          badge={{ cls: lpvV > 0 ? 'badge-green' : 'badge-muted', label: lpvV > 0 ? '↑ Activo' : '— Sin datos' }}
          value={fmtK(lpvV)}
          sub="Visitas reales atribuidas"
        >
          {fmtK(lpvV)} visitas reales. Triangula con GA4. <strong className="text-zinc-600 dark:text-zinc-300">Discrepancia &gt;30%</strong> → revisar UTMs.
        </KPICard>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {[
          { label: 'CPC · LPV',        val: fmt$(m.cpc),   change: cpc <= 2.5 ? '▼ Eficiente · <$2.50' : cpc <= 4 ? '⚠ Revisar · >$2.50' : '▲ Alto · Optimizar',  color: cpc <= 2.5 ? 'text-pgreen' : cpc <= 4 ? 'text-pamber' : 'text-accent' },
          { label: 'CPM · SUBASTA',    val: fmt$(m.cpm),   change: cpm <= 15 ? '✓ Subasta eficiente' : cpm <= 25 ? '⚠ CPM elevado' : '▲ CPM alto · Revisar', color: cpm <= 15 ? 'text-pgreen' : cpm <= 25 ? 'text-pamber' : 'text-accent' },
          { label: 'GASTO TOTAL',      val: '$' + Number(m.spend || 0).toLocaleString(), change: data.period, color: 'text-zinc-400' },
          { label: 'FRECUENCIA',       val: (freq).toFixed(1) + '×', change: freq <= 2.0 ? '✓ Rango óptimo' : freq <= 3.0 ? '⚠ Monitorear · >2.5× alerta' : '▲ Saturación · Rotar creative', color: freq <= 2.0 ? 'text-pgreen' : freq <= 3.0 ? 'text-pamber' : 'text-accent' },
          { label: 'CPM ALCANCE ÚNICO',val: fmt$(m.cpm_reach), change: 'Costo llegar 1 nuevo', color: 'text-zinc-400' },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-xl px-4 py-4 hover:-translate-y-px hover:shadow-md transition-all">
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 uppercase tracking-widest mb-1.5">{item.label}</div>
            <div className="font-[family-name:var(--font-roboto-cond)] text-2xl font-light text-zinc-800 dark:text-zinc-100 tracking-tight">{item.val}</div>
            <div className={`text-xs font-[family-name:var(--font-roboto-mono)] mt-1 ${item.color}`}>{item.change}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNNEL SECTION
// ─────────────────────────────────────────────────────────────────────────────
function FunnelSection({ data }: { data: DashboardData }) {
  const m = data.metrics;
  const freqCalc = m.impressions && m.reach ? (m.impressions / m.reach).toFixed(2) : (m.freq ?? '--');
  const lpvPct   = m.lpv_rate ?? (m.lpv_total && m.link_clicks ? (m.lpv_total / m.link_clicks * 100).toFixed(1) : '--');
  const intentPct = m.lpv_total && m.intent_clicks ? (m.intent_clicks / m.lpv_total * 100).toFixed(1) : '--';

  const steps = [
    { val: fmtK(m.impressions), key: 'Impresiones',    pct: 'base',                      warn: false  },
    { val: fmtK(m.reach),       key: 'Alcance único',  pct: `Frec. ${freqCalc}×`,        warn: false  },
    { val: fmtK(m.link_clicks), key: 'Link Clicks',    pct: `CTR ${fmtPct(m.ctr)}`,      warn: false  },
    { val: fmtK(m.lpv_total ?? m.lpv), key: 'LPV', pct: `${lpvPct}% de LC ${parseFloat(String(lpvPct)) < 85 ? '⚠' : ''}`, warn: parseFloat(String(lpvPct)) < 85 },
    { val: fmtK(m.intent_clicks ?? m.lpv), key: 'Clic Intención', pct: `${intentPct}% de LPV`, warn: false, main: true },
  ];

  return (
    <section id="funnel" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">03</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Embudo de Entrega</h2>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">Punto de entrega al cliente</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/6 dark:border-white/6 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Flujo: Impresión → Intención Alta</span>
          <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-3 py-1.5 rounded-full">◎ Período analizado</span>
        </div>
        <div className="p-6">
          <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center min-w-[90px]">
                  <div className={`w-full rounded-xl px-3 py-3.5 text-center border hover:-translate-y-0.5 transition-transform
                    ${step.main ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40' :
                      step.warn ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' :
                      'bg-zinc-50 dark:bg-zinc-800 border-black/8 dark:border-white/8'}`}>
                    <div className={`font-[family-name:var(--font-roboto-cond)] text-xl font-light tracking-tight ${step.main ? 'text-accent' : step.warn ? 'text-pamber' : 'text-zinc-800 dark:text-zinc-100'}`}>{step.val}</div>
                    <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 mt-1 uppercase tracking-wide">{step.key}</div>
                  </div>
                  <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mt-2">{step.pct}</div>
                </div>
                {i < steps.length - 1 && <span className="text-zinc-300 dark:text-zinc-600 text-xl mx-1 flex-shrink-0 self-center">›</span>}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-light text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-pblue">⟶ Punto de entrega de Proyecta:</strong> Tu trabajo termina en <strong className="text-zinc-700 dark:text-zinc-200">{fmtK(m.intent_clicks ?? m.lpv)} clics de alta intención</strong> entregados. Solicita acceso a GA4 para triangular. Esa comparativa es tu argumento de renovación.
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGNS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function CampaignsSection({ data, onOpenModal }: { data: DashboardData; onOpenModal: (idx: number) => void }) {
  const campaigns = data.campaigns;
  const scored = campaigns.filter(c => c.cpli && c.ctr)
    .map((c, i) => ({ ...c, _idx: i, score: (c.ctr! / c.cpli!) * ((c.freq ?? 3) < 2.5 ? 1.2 : .8) }))
    .sort((a, b) => b.score! - a.score!);
  const winner = scored[0];

  return (
    <section id="campaigns" className="mb-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">04</span>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Detalle por Campaña</h2>
        </div>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">{campaigns.length} campañas</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Campañas del período</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                {['Campaña','Gasto','CPC-LPV','CPL-I','CTR','LPV','Frecuencia','Clics Intención','Acción','AI'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const isW = winner && c.name === winner.name;
                return (
                  <tr key={i} className={`border-t border-black/4 dark:border-white/4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isW ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                    <td className="px-4 py-3 text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                      {isW && <span className="text-accent mr-1">★</span>}{c.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">${Number(c.spend).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{fmt$(c.cpc)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{fmt$(c.cpli)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{fmtPct(c.ctr)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{fmtK(c.lpv)}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{(c.freq ?? 0).toFixed(1)}×</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{fmtK(c.intent)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium ${getActionChipClass(c.action)}`}>{c.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onOpenModal(i)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium bg-red-50 dark:bg-red-950/30 text-accent border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors whitespace-nowrap">
                        Analizar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATIVE SECTION
// ─────────────────────────────────────────────────────────────────────────────
function CreativeSection({ data, apiKey, onOpenModal }: { data: DashboardData; apiKey: string; onOpenModal: (idx: number) => void }) {
  const campaigns = data.campaigns;
  const scored = campaigns.filter(c => c.cpli && c.ctr)
    .map((c, i) => ({ ...c, _idx: i, score: (c.ctr! / c.cpli!) * ((c.freq ?? 3) < 2.5 ? 1.2 : .8) }))
    .sort((a, b) => b.score! - a.score!);
  const winner = scored[0] || { ...campaigns[0], _idx: 0 };

  const [variantsState, setVariantsState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [variantsData, setVariantsData]   = useState<VariantData[]>([]);
  const [variantError, setVariantError]   = useState('');

  interface VariantData { num: string; formato: string; titulo: string; hook: string; descripcion: string; tags: string[]; }

  const generateVariants = async () => {
    if (!winner) return;
    setVariantsState('loading');
    const gm = data.metrics;
    const prompt = `Eres un estratega creativo experto en Meta Ads para turismo y comercio en México. Analiza este ad ganador y genera 3 variantes para recrearlo y mejorarlo.

Ad Ganador: "${winner.name}"
CPL-I: $${(winner.cpli||0).toFixed(2)} | CTR: ${(winner.ctr||0).toFixed(1)}% | Frecuencia: ${(winner.freq||0).toFixed(1)}x | LPV: ${winner.lpv||0}
Contexto cuenta: Gasto total $${gm.spend||0} · CPL-I promedio $${(gm.cpli||0).toFixed(2)} · ${campaigns.length} campañas activas

Responde SOLO en JSON sin texto extra ni markdown:
{"variantes":[
  {"num":"VARIANTE 01","formato":"[Video Reel/Imagen Estática/Carrusel/Story]","titulo":"...","hook":"...","descripcion":"...","tags":["...","...","..."]},
  {"num":"VARIANTE 02","formato":"...","titulo":"...","hook":"...","descripcion":"...","tags":["..."]},
  {"num":"VARIANTE 03","formato":"...","titulo":"...","hook":"...","descripcion":"...","tags":["..."]}
]}`;
    try {
      if (!apiKey) throw new Error('Configura tu Claude API key primero');
      let text = await callClaude(apiKey, prompt);
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(text);
      if (parsed?.variantes) {
        setVariantsData(parsed.variantes);
        setVariantsState('done');
      } else throw new Error('Respuesta inesperada de la IA');
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : 'Error desconocido');
      setVariantsState('error');
    }
  };

  const freqVal  = data.metrics.freq ?? 0;
  const STRIPE_COLORS = ['variant-stripe-green','variant-stripe-amber','variant-stripe-blue'];

  return (
    <section id="creative" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">05</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Creative & Señales de Fatiga</h2>
      </div>

      {/* Winner highlight */}
      {winner && (
        <div className="winner-rainbow relative bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap mb-3.5 overflow-hidden">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-accent tracking-widest uppercase mb-1">Mejor Performance del Período</div>
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">{winner.name}</div>
              <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mt-0.5">CTR {fmtPct(winner.ctr)} · CPL-I {fmt$(winner.cpli)} · Frec {(winner.freq||0).toFixed(1)}×</div>
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
            {[
              { val: fmt$(winner.cpli), key: 'CPL-I'         },
              { val: fmtPct(winner.ctr), key: 'CTR'          },
              { val: (winner.freq||0).toFixed(1)+'×', key: 'Frecuencia'  },
              { val: fmtK(winner.intent ?? winner.lpv), key: 'Clics intención' },
            ].map(m => (
              <div key={m.key} className="text-center">
                <div className="font-[family-name:var(--font-roboto-cond)] text-xl font-light text-zinc-800 dark:text-zinc-100">{m.val}</div>
                <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 mt-0.5 tracking-wide">{m.key}</div>
              </div>
            ))}
          </div>
          <button onClick={() => onOpenModal(winner._idx ?? 0)} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-sm font-[family-name:var(--font-roboto-mono)] font-medium text-accent hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors whitespace-nowrap">
            ⚡ Analizar ad a fondo
          </button>
        </div>
      )}

      {/* Variants */}
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden mb-3.5">
        <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-800/40 flex items-center gap-2.5">
          <span className="text-sm opacity-70">⬡</span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">3 Variantes para Recrear el Ad Ganador</span>
          <button onClick={generateVariants} disabled={variantsState === 'loading'} className="ml-auto text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/8 dark:border-white/8 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            {variantsState === 'loading' ? '⏳ Generando…' : '✦ Generar con IA'}
          </button>
          <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">Basado en el mejor ad del período</span>
        </div>
        {variantsState === 'idle' && (
          <div className="p-8 text-center">
            <p className="text-sm font-light text-zinc-600 dark:text-zinc-400 mb-2">Las variantes se generan con base en el ad ganador del período.</p>
            <small className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">Haz clic en &quot;Generar con IA&quot; · Requiere Claude API key</small>
          </div>
        )}
        {variantsState === 'loading' && (
          <div className="flex items-center gap-3 p-8 text-zinc-400">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200 dark:border-zinc-600 border-t-accent animate-spin-slow flex-shrink-0" />
            <span className="text-sm font-light">Generando 3 variantes con Claude AI…</span>
          </div>
        )}
        {variantsState === 'error' && (
          <div className="p-6 text-center">
            <p className="text-sm text-accent mb-1">Error al generar variantes</p>
            <small className="text-xs text-zinc-400">{variantError}</small>
          </div>
        )}
        {variantsState === 'done' && variantsData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black/6 dark:divide-white/6">
            {variantsData.map((v, i) => (
              <div key={i} className={`relative p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors overflow-hidden ${STRIPE_COLORS[i] || 'variant-stripe-green'}`}>
                <div className={`text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium uppercase tracking-widest mb-1.5 ${i === 0 ? 'text-pgreen' : i === 1 ? 'text-pamber' : 'text-pblue'}`}>{v.num}</div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-roboto-mono)] mb-2.5 border ${fmtClass(v.formato)}`}>{v.formato}</span>
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-2">{v.titulo}</div>
                <div className="text-xs italic text-zinc-500 dark:text-zinc-400 mb-2 pl-2.5 border-l-2 border-zinc-200 dark:border-zinc-600">&ldquo;{v.hook}&rdquo;</div>
                <div className="text-xs font-light text-zinc-400 leading-relaxed mb-3">{v.descripcion}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(v.tags || []).map((t, j) => (
                    <span key={j} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 border border-black/6 dark:border-white/6 text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creative cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { name: 'Frecuencia del período',    val: freqVal.toFixed(1) + '×', state: freqVal > 2.5 ? 'warn' : 'ok',   alert: '>2.5×' },
          { name: 'CPL-I promedio cuenta',     val: fmt$(data.metrics.cpli),  state: (data.metrics.cpli??99) < 5 ? 'ok' : 'warn', alert: 'bench <$5' },
          { name: 'CTR promedio',              val: fmtPct(data.metrics.ctr), state: (data.metrics.ctr??0) >= 2 ? 'ok' : 'warn', alert: '>2%' },
          { name: 'LPV / LC tasa',             val: fmtPct(data.metrics.lpv_rate), state: (data.metrics.lpv_rate??0) >= 85 ? 'ok' : 'warn', alert: '>85%' },
        ].map(item => (
          <div key={item.name} className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-xl p-4 hover:-translate-y-px hover:shadow-md transition-all">
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 mb-3 uppercase tracking-wide">{item.name}</div>
            <div className={`text-2xl font-[family-name:var(--font-roboto-cond)] font-light mb-1 ${item.state === 'ok' ? 'text-pgreen' : 'text-pamber'}`}>{item.val}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-[family-name:var(--font-roboto-mono)] text-zinc-400">Meta: {item.alert}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${item.state === 'ok' ? 'bg-green-50 dark:bg-green-950/30 text-pgreen' : 'bg-amber-50 dark:bg-amber-950/30 text-pamber'}`}>
                {item.state === 'ok' ? '✓ OK' : '⚠ Monit.'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function AlertsSection({ data }: { data: DashboardData }) {
  const m = data.metrics, campaigns = data.campaigns, bench = 5;
  const alerts: { type: string; icon: string; title: string; desc: string; action: string }[] = [];

  campaigns.forEach(c => {
    if (c.cpli && c.cpli > bench * 2) alerts.push({
      type: 'crit', icon: '!',
      title: `${c.name} — CPL-I ${fmt$(c.cpli)} supera 2× benchmark`,
      desc:   (c.freq ?? 0) > 3
        ? `Frecuencia ${c.freq}× confirma saturación. Creative agotado. Pausar y crear nuevo ad antes de reactivar.`
        : 'CPL-I fuera de rango. Revisar segmentación, creativos y relevancia del CTA.',
      action: 'Pausar · Crear nuevo creative',
    });
  });

  if (m.lpv_rate && m.lpv_rate < 85) alerts.push({
    type:   m.lpv_rate < 70 ? 'crit' : 'warn', icon: '?',
    title:  `Tasa LPV/LC en ${fmtPct(m.lpv_rate)} — Fricción post-clic`,
    desc:   `El ${(100 - m.lpv_rate).toFixed(0)}% de los clics no completan la carga. Revisar velocidad de carga mobile.`,
    action: 'Auditar PageSpeed mobile · Considerar landing propia',
  });

  campaigns.forEach(c => {
    if (c.cpli && c.cpli < bench * .7 && (c.freq ?? 3) < 2.0 && (c.ctr ?? 0) > 2.5) alerts.push({
      type: 'ok', icon: '✓',
      title: `${c.name} — Señal de escala activa`,
      desc:  `CPL-I ${fmt$(c.cpli)} sostenido con CTR ${fmtPct(c.ctr)} y frecuencia ${c.freq}× controlada. Incrementar +20% y producir variación.`,
      action: 'Escalar budget +20% · Producir variación creative',
    });
  });

  alerts.push({
    type: 'info', icon: 'i',
    title: 'Solicitar datos de conversión al cliente',
    desc:  `Entregaste ${fmtK(m.intent_clicks ?? m.lpv)} clics de alta intención. Pedir número de ventas/reservas del período vs anterior.`,
    action: 'Enviar solicitud semanal al cliente',
  });

  const COLORS: Record<string, { border: string; icon: string; title: string; action: string }> = {
    crit: { border: 'alert-crit', icon: 'text-accent',   title: 'text-accent',   action: 'bg-red-50 dark:bg-red-950/30 text-accent'    },
    warn: { border: 'alert-warn', icon: 'text-pamber',   title: 'text-pamber',   action: 'bg-amber-50 dark:bg-amber-950/30 text-pamber'  },
    ok:   { border: 'alert-ok',   icon: 'text-pgreen',   title: 'text-pgreen',   action: 'bg-green-50 dark:bg-green-950/30 text-pgreen'  },
    info: { border: 'alert-info', icon: 'text-pblue',    title: 'text-pblue',    action: 'bg-blue-50 dark:bg-blue-950/30 text-pblue'    },
  };

  return (
    <section id="alerts" className="mb-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">06</span>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Alertas — Acciones Inmediatas</h2>
        </div>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">{alerts.length} alertas activas</span>
      </div>
      <div className="flex flex-col gap-2">
        {alerts.map((a, i) => {
          const c = COLORS[a.type];
          return (
            <div key={i} className={`${c.border} bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl px-5 py-4 flex gap-3.5 items-start hover:-translate-y-px hover:shadow-md transition-all`}>
              <span className={`text-base flex-shrink-0 mt-0.5 ${c.icon}`}>{a.icon}</span>
              <div>
                <div className={`text-sm font-medium mb-1 ${c.title}`}>{a.title}</div>
                <div className="text-xs font-light text-zinc-500 dark:text-zinc-400 leading-relaxed">{a.desc}</div>
                <span className={`inline-block mt-2 text-xs font-[family-name:var(--font-roboto-mono)] font-medium px-2.5 py-0.5 rounded-full tracking-wide ${c.action}`}>{a.action}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function DecisionsSection({ data }: { data: DashboardData }) {
  const campaigns = data.campaigns, bench = 5;
  const scale  = campaigns.filter(c => c.cpli && c.cpli < bench * .7 && (c.freq ?? 3) < 2.0);
  const pause  = campaigns.filter(c => (c.cpli && c.cpli > bench * 2) || ((c.freq ?? 0) > 4.5));
  const optim  = campaigns.filter(c => !scale.includes(c) && !pause.includes(c));

  const decs = [
    {
      cls: 'dh-scale', labelCls: 'text-pgreen', label: 'ESCALAR',
      items: ['CPL-I bajo benchmark 3+ días consecutivos','CTR >2% + frecuencia <2× + LPV/LC >85%','Budget utilization 88-95% sin spike CPM','Audiencia <60% saturada · Regla: +20% máx cada 3-4 días', scale.length ? `Candidatas: ${scale.map(c=>c.name).join(', ')}` : 'Sin candidatas aún'],
    },
    {
      cls: 'dh-optimize', labelCls: 'text-pamber', label: 'OPTIMIZAR',
      items: ['CPL-I sube >20% vs semana anterior','Frecuencia 2.5-3.5× → rotar creative','LPV/LC <75% → alertar cliente sobre sitio','CTR baja + CPM estable → problema creative', optim.length ? `En proceso: ${optim.map(c=>c.name).join(', ')}` : ''].filter(Boolean),
    },
    {
      cls: 'dh-pause', labelCls: 'text-accent', label: 'PAUSAR',
      items: ['CPL-I >2× benchmark por 3 días','Frecuencia >4.5× en 7 días','CTR <0.8% en +1000 impresiones','Negative feedback >0.3%', pause.length ? `Pausar ahora: ${pause.map(c=>c.name).join(', ')}` : 'Sin campañas en zona de pausa'],
    },
  ];

  return (
    <section id="decisions" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">07</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Árbol de Decisiones</h2>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">Basado en CPL-I y KPIs</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {decs.map(dec => (
          <div key={dec.label} className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden hover:shadow-md hover:border-zinc-200 dark:hover:border-white/10 transition-all">
            <div className={`${dec.cls} px-5 py-3 border-b border-black/6 dark:border-white/6`}>
              <span className={`text-xs font-bold tracking-widest uppercase ${dec.labelCls}`}>{dec.label}</span>
            </div>
            <div className="px-4 py-3">
              {dec.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-black/4 dark:border-white/4 last:border-b-0 text-xs font-light text-zinc-500 dark:text-zinc-400 leading-relaxed hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                  <span className="text-zinc-300 dark:text-zinc-600 flex-shrink-0 mt-0.5">›</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BENCHMARKS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function BenchmarksSection() {
  const rows = [
    ['CTR de enlace',          '>2.0%',    '>1.8%',    '<0.8%'],
    ['CPL-I',                  '<$5 USD',  '<$8 USD',  '>2× benchmark'],
    ['CPC Landing Page View',  '<$2.50 USD','<$4 USD', '>$6 USD'],
    ['Frecuencia — alerta',    '>2.5×',    '>3.0×',    '>4.5×'],
    ['Tasa LPV / Link Clicks', '>85%',     '>85%',     '<70%'],
    ['Hook Rate video 3s',     '>30%',     '>25%',     '<15%'],
    ['Negative Feedback Rate', '<0.1%',    '<0.1%',    '>0.3%'],
    ['Saturación audiencia',   '>70%',     '>65%',     '>80%'],
  ];
  return (
    <section id="benchmarks" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">08</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Benchmarks</h2>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">Turismo & E-commerce LATAM</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                {['Métrica','E-comm / Entretenimiento','Hotel / Alojamiento','Señal de alarma'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([metric, ecomm, hotel, alarm]) => (
                <tr key={metric} className="border-t border-black/4 dark:border-white/4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">{metric}</td>
                  <td className="px-4 py-3 text-xs font-medium text-pgreen">{ecomm}</td>
                  <td className="px-4 py-3 text-xs font-medium text-pgreen">{hotel}</td>
                  <td className="px-4 py-3 text-xs font-medium text-accent">{alarm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI INSIGHTS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function AIInsightsSection({ data, apiKey, bodyRef }: { data: DashboardData; apiKey: string; bodyRef?: React.RefObject<HTMLDivElement | null> }) {
  const [state,    setState]    = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [response, setResponse] = useState('');

  const run = async () => {
    setState('loading');
    const m = data.metrics, campaigns = data.campaigns;
    const summary = `Datos Meta Ads (${data.period}):\nGasto: $${(m.spend||0).toFixed(0)}\nCPL-I: $${(m.cpli||0).toFixed(2)} (bench <$5)\nCTR: ${(m.ctr||0).toFixed(1)}%\nFrecuencia: ${(m.freq||0).toFixed(1)}×\nCampañas:\n${campaigns.map(c=>`- ${c.name}: $${c.spend} CPL-I $${(c.cpli||0).toFixed(2)} CTR ${(c.ctr||0).toFixed(1)}% Frec ${(c.freq||0).toFixed(1)}× ${c.action}`).join('\n')}`;
    const prompt = `Eres estratega experto en Meta Ads. Analiza y da:\n1. Diagnóstico general (2-3 líneas)\n2. Top 3 prioridades inmediatas (específicas a campañas y métricas reales)\n3. Una oportunidad no obvia\nDirecto, específico, basado en números. Español.\n\n${summary}`;
    try {
      if (!apiKey) throw new Error('Configura tu Claude API key primero');
      const text = await callClaude(apiKey, prompt, 1000);
      setResponse(text);
      setState('done');
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Error desconocido');
      setState('error');
    }
  };

  return (
    <section id="aiinsights" className="mb-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">09</span>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">AI Insights</h2>
        </div>
        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-pblue uppercase tracking-widest">CLAUDE API</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base">✦</span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Análisis inteligente por cuenta</span>
          </div>
          <button onClick={run} disabled={state === 'loading'} className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/8 dark:border-white/8 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            {state === 'loading' ? '⏳ Analizando…' : 'Generar análisis'}
          </button>
        </div>
        <div ref={bodyRef} className="p-6">
          {state === 'idle' && (
            <div className="text-center py-10">
              <p className="text-sm font-light text-zinc-600 dark:text-zinc-400 mb-2">Los insights de IA se generan en base a los datos reales de tu CSV.</p>
              <small className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">Haz clic en &quot;Generar análisis&quot; o carga un CSV · Requiere Claude API key</small>
            </div>
          )}
          {state === 'loading' && (
            <div className="flex items-center gap-3 py-6">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200 dark:border-zinc-600 border-t-pblue animate-spin-slow flex-shrink-0" />
              <span className="text-sm font-light text-zinc-400">Generando análisis con Claude AI…</span>
            </div>
          )}
          {state === 'done' && (
            <div className="text-sm font-light text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: response.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong class="text-zinc-700 dark:text-zinc-200 font-medium">$1</strong>') }} />
          )}
          {state === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
              <p className="text-sm font-medium text-accent mb-1">Error al conectar con Claude API</p>
              <p className="text-xs text-zinc-500">{response}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    'badge-green': 'bg-green-50 dark:bg-green-950/30 text-pgreen',
    'badge-amber': 'bg-amber-50 dark:bg-amber-950/30 text-pamber',
    'badge-red':   'bg-red-50 dark:bg-red-950/30 text-accent',
    'badge-muted': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-black/8 dark:border-white/8',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium mb-1.5 ${cls[variant] || cls['badge-muted']}`}>
      {children}
    </span>
  );
}

function KPICard({ label, badge, value, sub, children }: {
  label: string; badge: { cls: string; label: string }; value: string; sub: string; children: React.ReactNode;
}) {
  return (
    <div className="kpi-card relative bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl p-5 transition-all hover:-translate-y-px hover:shadow-xl group overflow-hidden">
      <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest mb-2.5">{label}</div>
      <Badge variant={badge.cls}>{badge.label}</Badge>
      <div className="font-[family-name:var(--font-roboto-cond)] text-4xl font-light tracking-[-2px] leading-none my-2 text-zinc-800 dark:text-zinc-100">{value}</div>
      <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mb-1.5">{sub}</div>
      <div className="text-xs font-light text-zinc-400 leading-relaxed mt-3 pt-3 border-t border-black/6 dark:border-white/6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardContent({ data, apiKey, isDark, onOpenModal, aiBodyRef }: Props) {
  return (
    <div id="dashboardContent">
      <KPISection data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <ChartsSection data={data} isDark={isDark} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <FunnelSection data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <CampaignsSection data={data} onOpenModal={onOpenModal} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <CreativeSection data={data} apiKey={apiKey} onOpenModal={onOpenModal} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <AlertsSection data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <DecisionsSection data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <BenchmarksSection />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <AIInsightsSection data={data} apiKey={apiKey} bodyRef={aiBodyRef} />
      <div className="h-12" />
    </div>
  );
}
