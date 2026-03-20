'use client';
import { useState } from 'react';
import { DashboardData, Industry } from '../lib/types';
import { fmt$, fmtPct, fmtK, fmtClass, getActionChipClass } from '../lib/utils';
import { callClaude } from '../lib/claude';
import { getBenchmark, calcWinnerScore, INDUSTRY_BENCHMARKS } from '../lib/data';
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
  const bench = getBenchmark(data.industry);
  const isMsg = data.mode === 'messages';
  const cpli = m.cpli ?? 0;
  const cpr  = m.cpr ?? 0;
  const ctr  = m.ctr  ?? 0;
  const lpvR = m.lpv_rate ?? 0;
  const msgR = m.msg_rate ?? 0;
  const lpvV = m.lpv ?? m.intent_clicks ?? 0;
  const resV = m.total_results ?? 0;
  const cpc  = m.cpc ?? 0;
  const cpm  = m.cpm ?? 0;
  const freq = m.freq ?? 0;

  // ── Messages mode badges ──
  const cprScale  = bench.cprScale ?? 15;
  const cprStable = bench.cprStable ?? 50;
  const cprPause  = bench.cprPause ?? 80;
  const mrMin     = bench.msgRateMin ?? 10;

  const cprBadge = cpr <= 0 ? { cls: 'badge-muted', label: '— Sin datos' }
    : cpr < cprScale ? { cls: 'badge-green', label: '▼ Bajo benchmark' }
    : cpr < cprStable ? { cls: 'badge-amber', label: '⚠ Monitorear' }
    : { cls: 'badge-red', label: '▲ Sobre benchmark' };

  const msgRateBadge = msgR >= mrMin * 2 ? { cls: 'badge-green', label: '▲ Excelente' }
    : msgR >= mrMin ? { cls: 'badge-green', label: '✓ Sólido' }
    : msgR > 0 ? { cls: 'badge-amber', label: '⚠ Bajo' }
    : { cls: 'badge-muted', label: '— Sin datos' };

  // ── Traffic mode badges ──
  const cpliBadge = cpli <= 0 ? { cls: 'badge-muted', label: '— Sin datos' }
    : cpli < bench.scale ? { cls: 'badge-green', label: '▼ Bajo benchmark' }
    : cpli < bench.optimize ? { cls: 'badge-amber', label: '⚠ Monitorear' }
    : { cls: 'badge-red', label: '▲ Sobre benchmark' };

  const ctrBadge = ctr >= bench.ctrMin * 1.5 ? { cls: 'badge-green', label: '▲ Excelente' }
    : ctr >= bench.ctrMin ? { cls: 'badge-green', label: '✓ Sólido' }
    : ctr >= 0.5 ? { cls: 'badge-amber', label: '⚠ Bajo — Revisar creative' }
    : ctr > 0 ? { cls: 'badge-red', label: '▼ Crítico' }
    : { cls: 'badge-muted', label: '— Sin datos' };

  const ctrDesc = isMsg
    ? (ctr >= bench.ctrMin
      ? <>CTR de <strong>{fmtPct(ctr)}</strong> dentro del benchmark para campañas de mensajes en {data.industry}.</>
      : ctr > 0
      ? <>CTR de <strong>{fmtPct(ctr)}</strong> bajo para {data.industry}. En campañas de mensajes el CTR tiende a ser menor vs tráfico — enfócate en el costo por mensaje.</>
      : <>CTR no disponible. Verifica que el CSV incluya la columna de clics en el enlace.</>)
    : (ctr >= 3
      ? <>CTR de <strong>{fmtPct(ctr)}</strong> supera el benchmark. El creative está capturando atención. Buen momento para escalar.</>
      : ctr >= 2
      ? <>CTR de <strong>{fmtPct(ctr)}</strong> dentro del rango objetivo. Mantener y probar variantes.</>
      : ctr >= 1
      ? <>CTR de <strong>{fmtPct(ctr)}</strong> por debajo del benchmark. Revisar hook visual o copy de apertura.</>
      : <>CTR de <strong>{fmtPct(ctr)}</strong> es crítico. Pausar y renovar creative urgentemente.</>);

  const lpvBadge = lpvR >= 85 ? { cls: 'badge-green', label: '✓ Óptima' }
    : lpvR >= 70  ? { cls: 'badge-amber', label: '⚠ Monitorear' }
    : lpvR > 0 ? { cls: 'badge-red', label: '▼ Crítica — Fricción alta' }
    : { cls: 'badge-muted', label: '— Sin datos' };

  const lpvDesc = lpvR >= 85
    ? <>Tasa de <strong>{fmtPct(lpvR)}</strong> excelente. La página carga bien en mobile.</>
    : lpvR >= 70
    ? <>Tasa de <strong>{fmtPct(lpvR)}</strong> por debajo del objetivo de 85%. Revisar velocidad mobile.</>
    : lpvR > 0
    ? <>Tasa de <strong>{fmtPct(lpvR)}</strong> crítica. <strong>Problema del sitio</strong>: auditar PageSpeed mobile urgente.</>
    : <>Sin datos de landing page views. {isMsg ? 'Normal en campañas de mensajes.' : 'Verifica el mapeo de columnas.'}</>;

  return (
    <section id="kpis" className="mb-8 fade-in">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">01</span>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">{isMsg ? 'KPIs de Mensajes' : 'KPIs de Intención'}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isMsg && <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-pblue bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 px-2.5 py-1 rounded-full tracking-wide">Modo Mensajes</span>}
          <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-3 py-1.5 rounded-full tracking-wide">◎ {data.period}</span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        {/* Primary KPI: CPR (messages) or CPL-I (traffic) */}
        {isMsg ? (
          <div className={`kpi-card relative bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl p-5 transition-all hover:-translate-y-px hover:shadow-xl group overflow-hidden ${cprBadge.cls !== 'badge-muted' ? 'kpi-card-main' : ''}`}>
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest mb-2.5">CPR · Costo por Mensaje</div>
            <Badge variant={cprBadge.cls}>{cprBadge.label}</Badge>
            <div className={`font-[family-name:var(--font-roboto-cond)] text-4xl font-light tracking-[-2px] leading-none my-2 ${cpr > 0 && cpr < cprScale ? 'text-accent' : 'text-zinc-800 dark:text-zinc-100'}`}>{fmt$(m.cpr)}</div>
            <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mb-1.5">{data.industry} · Escalar &lt;${cprScale} · Pausar &gt;${cprPause}</div>
            <div className="text-xs font-light text-zinc-400 leading-relaxed mt-3 pt-3 border-t border-black/6 dark:border-white/6">
              <strong className="text-zinc-600 dark:text-zinc-300">KPI principal</strong>: costo por cada mensaje/conversación iniciada por el usuario.
            </div>
          </div>
        ) : (
          <div className={`kpi-card relative bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl p-5 transition-all hover:-translate-y-px hover:shadow-xl group overflow-hidden ${cpliBadge.cls !== 'badge-muted' ? 'kpi-card-main' : ''}`}>
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest mb-2.5">CPL-I · Costo por Clic Intención</div>
            <Badge variant={cpliBadge.cls}>{cpliBadge.label}</Badge>
            <div className={`font-[family-name:var(--font-roboto-cond)] text-4xl font-light tracking-[-2px] leading-none my-2 ${cpli > 0 && cpli < bench.scale ? 'text-accent' : 'text-zinc-800 dark:text-zinc-100'}`}>{fmt$(m.cpli)}</div>
            <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mb-1.5">{data.industry} · Escalar &lt;${bench.scale} · Pausar &gt;${bench.pause}</div>
            <div className="text-xs font-light text-zinc-400 leading-relaxed mt-3 pt-3 border-t border-black/6 dark:border-white/6">
              <strong className="text-zinc-600 dark:text-zinc-300">KPI principal</strong>: costo de llevar al usuario hasta el clic en compra/reserva.
            </div>
          </div>
        )}

        {/* CTR */}
        <KPICard label="CTR ENLACE" badge={ctrBadge} value={fmtPct(m.ctr)} sub={`Meta >${bench.ctrMin}%`}>
          {ctrDesc}
        </KPICard>

        {/* Messages: Msg Rate | Traffic: LPV Rate */}
        {isMsg ? (
          <KPICard label="TASA MENSAJES / CLICKS" badge={msgRateBadge} value={fmtPct(m.msg_rate)} sub={`Meta >${mrMin}%`}>
            {msgR >= mrMin
              ? <>Tasa de <strong>{fmtPct(msgR)}</strong> saludable. Los creativos están generando conversación.</>
              : msgR > 0
              ? <>Tasa de <strong>{fmtPct(msgR)}</strong> por debajo del mínimo de {mrMin}%. Revisar CTA y destino de las campañas.</>
              : <>Sin datos suficientes. Verifica que el CSV incluya la columna de Resultados.</>}
          </KPICard>
        ) : (
          <KPICard label="TASA LPV / CLICKS" badge={lpvBadge} value={fmtPct(m.lpv_rate)} sub="Meta >85%">
            {lpvDesc}
          </KPICard>
        )}

        {/* Messages: Total Results | Traffic: LPV Volume */}
        {isMsg ? (
          <KPICard
            label="TOTAL MENSAJES"
            badge={{ cls: resV > 0 ? 'badge-green' : 'badge-muted', label: resV > 0 ? '↑ Activo' : '— Sin datos' }}
            value={fmtK(resV)}
            sub="Mensajes/conversaciones"
          >
            {fmtK(resV)} mensajes generados. Solicita al cliente datos de citas agendadas vs mensajes para calcular tasa de cierre real.
          </KPICard>
        ) : (
          <KPICard
            label="VOLUMEN LPV"
            badge={{ cls: lpvV > 0 ? 'badge-green' : 'badge-muted', label: lpvV > 0 ? '↑ Activo' : '— Sin datos' }}
            value={fmtK(lpvV)}
            sub="Visitas reales atribuidas"
          >
            {fmtK(lpvV)} visitas reales. Triangula con GA4. <strong className="text-zinc-600 dark:text-zinc-300">Discrepancia &gt;30%</strong> → revisar UTMs.
          </KPICard>
        )}
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
  const bench = getBenchmark(data.industry);
  const isMsg = data.mode === 'messages';
  const freqCalc = m.impressions && m.reach ? (m.impressions / m.reach).toFixed(2) : (m.freq ?? '--');
  const lpvPct   = m.lpv_rate ?? (m.lpv_total && m.link_clicks ? (m.lpv_total / m.link_clicks * 100).toFixed(1) : '--');
  const intentPct = m.lpv_total && m.intent_clicks ? (m.intent_clicks / m.lpv_total * 100).toFixed(1) : '--';
  const msgPct   = m.msg_rate ?? (m.total_results && m.link_clicks ? (m.total_results / m.link_clicks * 100).toFixed(1) : '--');
  const mrMin    = bench.msgRateMin ?? 10;

  const steps = isMsg ? [
    { val: fmtK(m.impressions), key: 'Impresiones',    pct: 'base',                      warn: false  },
    { val: fmtK(m.reach),       key: 'Alcance único',  pct: `Frec. ${freqCalc}×`,        warn: false  },
    { val: fmtK(m.link_clicks), key: 'Link Clicks',    pct: `CTR ${fmtPct(m.ctr)}`,      warn: false  },
    { val: fmtK(m.total_results), key: 'Mensajes', pct: `${msgPct}% de LC ${parseFloat(String(msgPct)) < mrMin ? '⚠' : ''}`, warn: parseFloat(String(msgPct)) < mrMin, main: true },
  ] : [
    { val: fmtK(m.impressions), key: 'Impresiones',    pct: 'base',                      warn: false  },
    { val: fmtK(m.reach),       key: 'Alcance único',  pct: `Frec. ${freqCalc}×`,        warn: false  },
    { val: fmtK(m.link_clicks), key: 'Link Clicks',    pct: `CTR ${fmtPct(m.ctr)}`,      warn: false  },
    { val: fmtK(m.lpv_total ?? m.lpv), key: 'LPV', pct: `${lpvPct}% de LC ${parseFloat(String(lpvPct)) < bench.lpvMin ? '⚠' : ''}`, warn: parseFloat(String(lpvPct)) < bench.lpvMin },
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
  const isMsg = data.mode === 'messages';
  const scored = isMsg
    ? campaigns.filter(c => c.cpr && c.results)
        .map((c, i) => ({ ...c, _idx: i, score: (c.results ?? 0) / Math.max(c.cpr ?? 999, 0.01) * Math.log10(Math.max(c.spend, 10)) }))
        .sort((a, b) => b.score! - a.score!)
    : campaigns.filter(c => c.cpli && c.ctr)
        .map((c, i) => ({ ...c, _idx: i, score: calcWinnerScore(c.ctr!, c.cpli!, c.freq ?? 3, c.spend) }))
        .sort((a, b) => b.score! - a.score!);
  const winner = scored[0];

  const [sortField, setSortField] = useState<string>('spend');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const COLS: { key: string; label: string; get: (c: typeof campaigns[0]) => number | string }[] = isMsg ? [
    { key: 'name',    label: 'Campaña',           get: c => c.name },
    { key: 'spend',   label: 'Gasto',             get: c => c.spend },
    { key: 'results', label: 'Mensajes',          get: c => c.results ?? 0 },
    { key: 'cpr',     label: 'CPR ($/Msg)',       get: c => c.cpr ?? 0 },
    { key: 'ctr',     label: 'CTR',               get: c => c.ctr ?? 0 },
    { key: 'cpc',     label: 'CPC',               get: c => c.cpc ?? 0 },
    { key: 'freq',    label: 'Frecuencia',        get: c => c.freq ?? 0 },
    { key: 'action',  label: 'Acción',            get: c => c.action },
  ] : [
    { key: 'name',   label: 'Campaña',          get: c => c.name },
    { key: 'spend',  label: 'Gasto',             get: c => c.spend },
    { key: 'cpc',    label: 'CPC-LPV',           get: c => c.cpc ?? 0 },
    { key: 'cpli',   label: 'CPL-I',             get: c => c.cpli ?? 0 },
    { key: 'ctr',    label: 'CTR',               get: c => c.ctr ?? 0 },
    { key: 'lpv',    label: 'LPV',               get: c => c.lpv ?? 0 },
    { key: 'freq',   label: 'Frecuencia',        get: c => c.freq ?? 0 },
    { key: 'intent', label: 'Clics Intención',   get: c => c.intent ?? 0 },
    { key: 'action', label: 'Acción',            get: c => c.action },
  ];

  const sorted = [...campaigns].sort((a, b) => {
    const col = COLS.find(c => c.key === sortField);
    if (!col) return 0;
    const va = col.get(a), vb = col.get(b);
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: string) => {
    if (sortField === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(key); setSortDir('desc'); }
  };

  const exportTableCSV = () => {
    const header = ['Campaña','Gasto','CPC','CPL-I','CTR','LPV','Frecuencia','Clics Intención','Acción'];
    const rows = sorted.map(c => [
      `"${c.name}"`, c.spend, c.cpc??'', c.cpli?.toFixed(2)??'', c.ctr?.toFixed(1)??'',
      c.lpv??'', c.freq?.toFixed(1)??'', c.intent??'', c.action
    ]);
    const csv = '\uFEFF' + [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `campañas_${data.clientName.replace(/\s/g,'_')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <section id="campaigns" className="mb-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">04</span>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Detalle por Campaña</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportTableCSV} className="text-xs px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/8 text-zinc-500 hover:text-accent hover:border-accent transition-colors">
            ⬇ CSV
          </button>
          <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">{campaigns.length} campañas</span>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                {COLS.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    className="px-4 py-2.5 text-left text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors select-none">
                    {col.label} {sortField === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-left text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest whitespace-nowrap">AI</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const origIdx = campaigns.indexOf(c);
                const isW = winner && c.name === winner.name;
                return (
                  <tr key={i} className={`border-t border-black/4 dark:border-white/4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isW ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                    <td className="px-4 py-3 text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                      {isW && <span className="text-accent mr-1">★</span>}{c.name}
                    </td>
                    {COLS.filter(col => col.key !== 'name' && col.key !== 'action').map(col => {
                      const val = col.get(c);
                      let display = '';
                      if (col.key === 'spend') display = '$' + Number(val).toLocaleString();
                      else if (col.key === 'cpc' || col.key === 'cpli' || col.key === 'cpr') display = fmt$(val as number);
                      else if (col.key === 'ctr') display = fmtPct(val as number);
                      else if (col.key === 'freq') display = (val as number).toFixed(1) + '×';
                      else if (col.key === 'results') display = fmtK(val as number);
                      else if (col.key === 'lpv' || col.key === 'intent') display = fmtK(val as number);
                      else display = String(val);
                      return <td key={col.key} className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{display}</td>;
                    })}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium ${getActionChipClass(c.action)}`}>{c.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onOpenModal(origIdx)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium bg-red-50 dark:bg-red-950/30 text-accent border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors whitespace-nowrap">
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
  const bench = getBenchmark(data.industry);
  const scored = campaigns.filter(c => c.cpli && c.ctr)
    .map((c, i) => ({ ...c, _idx: i, score: calcWinnerScore(c.ctr!, c.cpli!, c.freq ?? 3, c.spend) }))
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
    const prompt = `Eres un estratega creativo experto en Meta Ads para ${data.industry} en México. Analiza este ad ganador y genera 3 variantes para recrearlo y mejorarlo.

Ad Ganador: "${winner.name}"
CPL-I: $${(winner.cpli||0).toFixed(2)} (benchmark industria: escalar <$${bench.scale}, pausar >$${bench.pause})
CTR: ${(winner.ctr||0).toFixed(1)}% (min industria: ${bench.ctrMin}%) | Frecuencia: ${(winner.freq||0).toFixed(1)}x | LPV: ${winner.lpv||0}
Cliente: ${data.clientName} | Industria: ${data.industry}
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

      {/* Creative health metrics (unique to this section) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {(() => {
          const b = getBenchmark(data.industry);
          const fmtCounts: Record<string, { count: number; totalCtr: number }> = {};
          campaigns.forEach(c => {
            const fmt = c.name.toLowerCase().includes('video') || c.name.toLowerCase().includes('reel') ? 'Video/Reel'
              : c.name.toLowerCase().includes('carousel') || c.name.toLowerCase().includes('carrusel') ? 'Carrusel'
              : c.name.toLowerCase().includes('static') || c.name.toLowerCase().includes('image') ? 'Imagen'
              : 'Otro';
            if (!fmtCounts[fmt]) fmtCounts[fmt] = { count: 0, totalCtr: 0 };
            fmtCounts[fmt].count++;
            fmtCounts[fmt].totalCtr += c.ctr ?? 0;
          });
          const bestFmt = Object.entries(fmtCounts).sort((a, b) => (b[1].totalCtr / b[1].count) - (a[1].totalCtr / a[1].count))[0];
          const prospCount = campaigns.filter(c => c.name.toLowerCase().includes('prosp') || c.name.toLowerCase().includes('broad') || c.name.toLowerCase().includes('lal')).length;
          const retargCount = campaigns.filter(c => c.name.toLowerCase().includes('retarg') || c.name.toLowerCase().includes('rmk')).length;
          return [
            { name: 'Mejor formato por CTR', val: bestFmt ? bestFmt[0] : '--', state: 'ok', alert: `${bestFmt ? (bestFmt[1].totalCtr / bestFmt[1].count).toFixed(1) + '% avg' : '--'}` },
            { name: 'Campañas prospección', val: String(prospCount), state: prospCount >= 2 ? 'ok' : 'warn', alert: prospCount >= 2 ? 'Diversificado' : 'Concentrado' },
            { name: 'Campañas retargeting', val: String(retargCount), state: retargCount >= 1 ? 'ok' : 'warn', alert: retargCount >= 1 ? 'Activo' : 'Sin retargeting' },
            { name: 'Fatiga de creative', val: freqVal > b.freqAlert ? 'Alta' : freqVal > 2.0 ? 'Media' : 'Baja', state: freqVal > b.freqAlert ? 'warn' : 'ok', alert: `Freq ${freqVal.toFixed(1)}× / alerta ${b.freqAlert}×` },
          ];
        })().map(item => (
          <div key={item.name} className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-xl p-4 hover:-translate-y-px hover:shadow-md transition-all">
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 mb-3 uppercase tracking-wide">{item.name}</div>
            <div className={`text-2xl font-[family-name:var(--font-roboto-cond)] font-light mb-1 ${item.state === 'ok' ? 'text-pgreen' : 'text-pamber'}`}>{item.val}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-[family-name:var(--font-roboto-mono)] text-zinc-400">{item.alert}</span>
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
  const m = data.metrics, campaigns = data.campaigns;
  const bench = getBenchmark(data.industry);
  const alerts: { type: string; icon: string; title: string; desc: string; action: string }[] = [];

  campaigns.forEach(c => {
    if (c.cpli && c.cpli > bench.pause * 2) alerts.push({
      type: 'crit', icon: '!',
      title: `${c.name} — CPL-I ${fmt$(c.cpli)} supera 2× benchmark`,
      desc:   (c.freq ?? 0) > 3
        ? `Frecuencia ${c.freq}× confirma saturación. Creative agotado. Pausar y crear nuevo ad antes de reactivar.`
        : 'CPL-I fuera de rango. Revisar segmentación, creativos y relevancia del CTA.',
      action: 'Pausar · Crear nuevo creative',
    });
  });

  if (m.lpv_rate && m.lpv_rate < bench.lpvMin) alerts.push({
    type:   m.lpv_rate < 70 ? 'crit' : 'warn', icon: '?',
    title:  `Tasa LPV/LC en ${fmtPct(m.lpv_rate)} — Fricción post-clic`,
    desc:   `El ${(100 - m.lpv_rate).toFixed(0)}% de los clics no completan la carga. Revisar velocidad de carga mobile.`,
    action: 'Auditar PageSpeed mobile · Considerar landing propia',
  });

  campaigns.forEach(c => {
    if (c.cpli && c.cpli < bench.scale * .7 && (c.freq ?? 3) < 2.0 && (c.ctr ?? 0) > bench.ctrMin) alerts.push({
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
  const campaigns = data.campaigns;
  const bench = getBenchmark(data.industry);
  const scale  = campaigns.filter(c => c.cpli && c.cpli < bench.scale * .7 && (c.freq ?? 3) < 2.0);
  const pause  = campaigns.filter(c => (c.cpli && c.cpli > bench.pause * 2) || ((c.freq ?? 0) > 4.5));
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
function BenchmarksSection({ data }: { data: DashboardData }) {
  const m = data.metrics;
  const bench = getBenchmark(data.industry);
  const isMsg = data.mode === 'messages';
  const cprS  = bench.cprScale ?? 15;
  const cprSt = bench.cprStable ?? 50;
  const cprP  = bench.cprPause ?? 80;
  const mrMin = bench.msgRateMin ?? 10;

  const rows: [string, string, string, string, string, boolean][] = isMsg ? [
    ['Costo por Mensaje (CPR)',  `<$${cprS}`,         `<$${cprSt}`,  `>$${cprP}`,  fmt$(m.cpr),  (m.cpr??999) < cprSt],
    ['CTR de enlace',            `>${bench.ctrMin}%`,  '>0.5%',      '<0.3%',      fmtPct(m.ctr), (m.ctr??0) >= bench.ctrMin],
    ['Tasa Mensajes / Clics',    `>${mrMin}%`,         '>15%',       '<5%',        fmtPct(m.msg_rate), (m.msg_rate??0) >= mrMin],
    ['CPC',                      '<$5',                '<$8',        '>$15',       fmt$(m.cpc),  (m.cpc??999) < 8],
    ['Frecuencia — alerta',      `<${bench.freqAlert}×`, '<3.0×',    '>4.5×',      (m.freq??0).toFixed(1)+'×', (m.freq??0) < bench.freqAlert],
    ['CPM',                      `<$${bench.cpmAlert}`, '<$80',      '>$120',      fmt$(m.cpm),  (m.cpm??0) < bench.cpmAlert],
  ] : [
    ['CTR de enlace',          `>${bench.ctrMin}%`, '>1.8%',    '<0.8%', fmtPct(m.ctr), (m.ctr??0) >= bench.ctrMin],
    ['CPL-I',                  `<$${bench.scale}`,  `<$${bench.stable}`, `>$${bench.pause}`, fmt$(m.cpli), (m.cpli??999) < bench.stable],
    ['CPC Landing Page View',  '<$2.50',            '<$4',      '>$6',   fmt$(m.cpc), (m.cpc??999) < 4],
    ['Frecuencia — alerta',    `<${bench.freqAlert}×`, '<3.0×',  '>4.5×', (m.freq??0).toFixed(1)+'×', (m.freq??0) < bench.freqAlert],
    ['Tasa LPV / Link Clicks', `>${bench.lpvMin}%`, '>85%',     '<70%',  fmtPct(m.lpv_rate), (m.lpv_rate??0) >= bench.lpvMin],
    ['CPM',                    `<$${bench.cpmAlert}`, '<$100',   '>$150', fmt$(m.cpm), (m.cpm??0) < bench.cpmAlert],
  ];
  return (
    <section id="benchmarks" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">08</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Benchmarks</h2>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">{data.industry}</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                {['Métrica', data.industry, 'General', 'Alarma', 'Tu cuenta'].map(h => (
                  <th key={h} className={`px-4 py-2.5 text-left text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium uppercase tracking-widest ${h === 'Tu cuenta' ? 'text-accent' : 'text-zinc-400'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([metric, ind, gen, alarm, yours, ok]) => (
                <tr key={metric} className="border-t border-black/4 dark:border-white/4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">{metric}</td>
                  <td className="px-4 py-3 text-xs font-medium text-pgreen">{ind}</td>
                  <td className="px-4 py-3 text-xs font-medium text-pgreen">{gen}</td>
                  <td className="px-4 py-3 text-xs font-medium text-accent">{alarm}</td>
                  <td className={`px-4 py-3 text-xs font-bold ${ok ? 'text-pgreen' : 'text-accent'}`}>{yours} {ok ? '✓' : '⚠'}</td>
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
  const [parsed,   setParsed]   = useState<{ score_global: number; diagnostico: string; prioridades: { accion: string; impacto: string; campana: string }[]; oportunidad_oculta: string; desperdicio_estimado: string } | null>(null);

  const run = async () => {
    setState('loading');
    const m = data.metrics, campaigns = data.campaigns;
    const bench = getBenchmark(data.industry);
    const isMsg = data.mode === 'messages';
    const cprS = bench.cprScale ?? 15;
    const cprP = bench.cprPause ?? 80;
    const mrMin = bench.msgRateMin ?? 10;
    const summary = isMsg
      ? `Datos Meta Ads — Campañas de MENSAJES (${data.period}):\nCliente: ${data.clientName}\nIndustria: ${data.industry}\nKPI Principal: Costo por Mensaje (CPR)\nGasto: $${(m.spend||0).toFixed(0)} MXN\nCPR promedio: $${(m.cpr||0).toFixed(2)} (benchmark escalar <$${cprS}, pausar >$${cprP})\nTotal mensajes: ${m.total_results||0}\nTasa mensajes/clics: ${(m.msg_rate||0).toFixed(1)}% (min: ${mrMin}%)\nCTR: ${(m.ctr||0).toFixed(1)}% (min industria: ${bench.ctrMin}%)\nFrecuencia: ${(m.freq||0).toFixed(1)}× (alerta: ${bench.freqAlert}×)\nCampañas:\n${campaigns.map(c=>`- ${c.name}: $${c.spend} CPR $${(c.cpr||0).toFixed(2)} Msgs ${c.results||0} CTR ${(c.ctr||0).toFixed(1)}% Frec ${(c.freq||0).toFixed(1)}× Acción: ${c.action}`).join('\n')}`
      : `Datos Meta Ads (${data.period}):\nCliente: ${data.clientName}\nIndustria: ${data.industry}\nGasto: $${(m.spend||0).toFixed(0)} MXN\nCPL-I: $${(m.cpli||0).toFixed(2)} (benchmark escalar <$${bench.scale}, pausar >$${bench.pause})\nCTR: ${(m.ctr||0).toFixed(1)}% (min industria: ${bench.ctrMin}%)\nFrecuencia: ${(m.freq||0).toFixed(1)}× (alerta: ${bench.freqAlert}×)\nLPV Rate: ${(m.lpv_rate||0).toFixed(0)}% (min: ${bench.lpvMin}%)\nCampañas:\n${campaigns.map(c=>`- ${c.name}: $${c.spend} CPL-I $${(c.cpli||0).toFixed(2)} CTR ${(c.ctr||0).toFixed(1)}% Frec ${(c.freq||0).toFixed(1)}× Acción: ${c.action}`).join('\n')}`;
    const prompt = `Eres auditor senior de Meta Ads para ${data.industry} en México. Analiza estos datos contra los benchmarks de la industria.

Responde SOLO en JSON puro sin texto extra ni backticks:
{"score_global":7,"diagnostico":"máx 3 oraciones con hallazgos específicos","prioridades":[{"accion":"acción concreta","impacto":"alto","campana":"nombre real de la campaña"},{"accion":"...","impacto":"medio","campana":"..."},{"accion":"...","impacto":"bajo","campana":"..."}],"oportunidad_oculta":"1 oración con insight no obvio","desperdicio_estimado":"$X,XXX MXN/mes"}

${summary}`;
    try {
      if (!apiKey) throw new Error('Configura tu Claude API key primero');
      let text = await callClaude(apiKey, prompt, 2000);
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      try {
        const j = JSON.parse(text);
        setParsed(j);
        setState('done');
      } catch {
        setResponse(text);
        setParsed(null);
        setState('done');
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : 'Error desconocido');
      setState('error');
    }
  };

  const impactColor = (i: string) => i === 'alto' ? 'text-accent' : i === 'medio' ? 'text-pamber' : 'text-pblue';
  const impactBg = (i: string) => i === 'alto' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40' : i === 'medio' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40';
  const scoreColor = (s: number) => s >= 7 ? 'text-pgreen' : s >= 5 ? 'text-pamber' : 'text-accent';

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
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Análisis inteligente · {data.industry}</span>
          </div>
          <button onClick={run} disabled={state === 'loading'} className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-black/8 dark:border-white/8 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            {state === 'loading' ? '⏳ Analizando…' : 'Generar análisis'}
          </button>
        </div>
        <div ref={bodyRef} className="p-6">
          {state === 'idle' && (
            <div className="text-center py-10">
              <p className="text-sm font-light text-zinc-600 dark:text-zinc-400 mb-2">Los insights de IA se generan en base a los datos reales de tu CSV y los benchmarks de {data.industry}.</p>
              <small className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">Haz clic en &quot;Generar análisis&quot; · Requiere Claude API key</small>
            </div>
          )}
          {state === 'loading' && (
            <div className="flex items-center gap-3 py-6">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-200 dark:border-zinc-600 border-t-pblue animate-spin-slow flex-shrink-0" />
              <span className="text-sm font-light text-zinc-400">Analizando cuenta contra benchmarks de {data.industry}…</span>
            </div>
          )}
          {state === 'done' && parsed && (
            <div className="space-y-5">
              {/* Score + Diagnostico */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`font-[family-name:var(--font-roboto-cond)] text-4xl font-light ${scoreColor(parsed.score_global)}`}>{parsed.score_global}</div>
                  <div className="text-[10px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 uppercase tracking-wider">/10</div>
                </div>
                <div className="text-sm font-light text-zinc-600 dark:text-zinc-400 leading-relaxed">{parsed.diagnostico}</div>
              </div>
              {/* Prioridades */}
              <div>
                <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-zinc-400 uppercase tracking-widest mb-3 pb-2 border-b border-black/6 dark:border-white/6">Prioridades inmediatas</div>
                <div className="flex flex-col gap-2">
                  {(parsed.prioridades || []).map((pri, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${impactBg(pri.impacto)}`}>
                      <span className={`text-xs font-[family-name:var(--font-roboto-mono)] font-bold uppercase ${impactColor(pri.impacto)}`}>{pri.impacto}</span>
                      <div className="flex-1">
                        <div className="text-sm text-zinc-700 dark:text-zinc-200">{pri.accion}</div>
                        {pri.campana && <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 mt-1">→ {pri.campana}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Oportunidad + Desperdicio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-pblue uppercase tracking-widest mb-2">Oportunidad oculta</div>
                  <div className="text-sm font-light text-zinc-600 dark:text-zinc-400">{parsed.oportunidad_oculta}</div>
                </div>
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                  <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-accent uppercase tracking-widest mb-2">Desperdicio estimado</div>
                  <div className="font-[family-name:var(--font-roboto-cond)] text-2xl font-light text-accent">{parsed.desperdicio_estimado}</div>
                </div>
              </div>
            </div>
          )}
          {state === 'done' && !parsed && (
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
// PLAYBOOKS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function PlaybooksSection({ data }: { data: DashboardData }) {
  const bench = getBenchmark(data.industry);
  const playbooks = [
    {
      action: 'Escalar', color: 'text-pgreen', bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40',
      campaigns: data.campaigns.filter(c => c.action === 'Escalar'),
      steps: [
        `Verificar CPL-I < $${bench.scale} MXN sostenido por 3+ días (no solo un spike)`,
        'Incrementar presupuesto máximo +20% cada 3-4 días — nunca duplicar de golpe',
        `Confirmar frecuencia < ${bench.freqAlert}× — si sube post-escala, pausar el incremento`,
        'Producir 1-2 variaciones del creative ganador ANTES de escalar (tener backup)',
        'Monitorear CPM las primeras 48h — si sube >30%, la audiencia se está saturando',
      ]
    },
    {
      action: 'Optimizar', color: 'text-pamber', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40',
      campaigns: data.campaigns.filter(c => c.action === 'Optimizar'),
      steps: [
        `Revisar frecuencia — si > ${bench.freqAlert}×, ROTAR creative antes de hacer otra cosa`,
        'Revisar CTR últimos 3 días — si bajó >20% vs anterior, el creative se agotó → crear variación',
        'Revisar CPM — si subió >30% sin cambio en CTR, es presión de subasta → esperar 48h',
        `Revisar LPV rate — si < ${bench.lpvMin}%, ALERTAR AL CLIENTE sobre su sitio (no es problema del ad)`,
        'Si nada de lo anterior aplica → ajustar audiencia: ampliar 10-15% o probar nuevo interés',
      ]
    },
    {
      action: 'Pausar HOY', color: 'text-accent', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40',
      campaigns: data.campaigns.filter(c => c.action === 'Pausar HOY'),
      steps: [
        'Pausar la campaña INMEDIATAMENTE en Meta Ads Manager',
        'Documentar la razón: qué métrica detonó la pausa (CPL-I, frecuencia, o CTR)',
        'Redistribuir el presupuesto a campaña con señal de escala (si existe)',
        'Si no hay campaña para escalar → crear nueva con creative y audiencia DIFERENTE',
        'NO reactivar la campaña pausada — siempre crear una nueva desde cero',
      ]
    },
  ];

  return (
    <section id="playbooks" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">07b</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Playbooks de Acción</h2>
        <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 px-2.5 py-1 rounded-full">Checklists paso a paso</span>
      </div>
      <div className="flex flex-col gap-3">
        {playbooks.filter(pb => pb.campaigns.length > 0).map(pb => (
          <div key={pb.action} className={`border rounded-2xl overflow-hidden ${pb.bg}`}>
            <div className="px-5 py-3 border-b border-black/6 dark:border-white/6 flex items-center justify-between">
              <span className={`text-sm font-bold ${pb.color}`}>{pb.action}</span>
              <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">{pb.campaigns.map(c => c.name).join(', ')}</span>
            </div>
            <div className="px-5 py-4">
              {pb.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-black/4 dark:border-white/4 last:border-b-0">
                  <span className="w-5 h-5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {playbooks.every(pb => pb.campaigns.length === 0) && (
          <div className="text-center py-8 text-sm font-light text-zinc-400">Todas las campañas están estables — no hay acciones urgentes.</div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SCORECARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardScorecard({ data }: { data: DashboardData }) {
  const m = data.metrics;
  const bench = getBenchmark(data.industry);
  const campaigns = data.campaigns;
  const isMsg = data.mode === 'messages';

  const freqOkCount = campaigns.filter(c => (c.freq ?? 0) < bench.freqAlert).length;
  const hasRetarg = campaigns.some(c => c.name.toLowerCase().match(/retarg|rmk|remarket/));
  const hasProsp = campaigns.some(c => c.name.toLowerCase().match(/prosp|broad|lal|cold/));
  const cprS  = bench.cprScale ?? 15;
  const cprSt = bench.cprStable ?? 50;
  const cprP  = bench.cprPause ?? 80;
  const mrMin = bench.msgRateMin ?? 10;

  const checks: { ok: boolean; label: string; desc: string; fix: string }[] = [
    isMsg ? {
      ok: (m.cpr ?? 999) < cprSt,
      label: `CPR ${fmt$(m.cpr)} vs benchmark $${cprSt}`,
      desc: 'Eficiencia de presupuesto (mensajes)',
      fix: `Pausar campañas con CPR >${cprP} MXN. Redistribuir presupuesto a campañas con CPR <${cprS} MXN. Revisar audiencia y creative de las más caras.`,
    } : {
      ok: (m.cpli ?? 999) < bench.stable,
      label: `CPL-I ${fmt$(m.cpli)} vs benchmark $${bench.stable}`,
      desc: 'Eficiencia de presupuesto',
      fix: `Pausar campañas con CPL-I >${bench.pause} MXN. Redistribuir presupuesto a campañas con CPL-I <${bench.scale} MXN. Revisar segmentación y creativos de las más caras.`,
    },
    {
      ok: freqOkCount >= campaigns.length * 0.7,
      label: `${freqOkCount}/${campaigns.length} campañas bajo freq alerta`,
      desc: 'Salud de frecuencia',
      fix: `Rotar creativos en campañas con frecuencia >${bench.freqAlert}×. Ampliar audiencia 10-15% o pausar las saturadas y crear nuevas. No reutilizar el mismo creative.`,
    },
    {
      ok: campaigns.length >= 2,
      label: `${campaigns.length} campañas activas (min 2)`,
      desc: 'Diversidad de campañas',
      fix: 'Crear al menos 2 campañas activas con diferentes audiencias/creativos. Diversificar reduce riesgo si una campaña se satura.',
    },
    isMsg ? {
      ok: (m.msg_rate ?? 0) >= mrMin,
      label: `Tasa mensajes/clics ${fmtPct(m.msg_rate)} vs mín ${mrMin}%`,
      desc: 'Conversión a mensajes',
      fix: `Solo el ${fmtPct(m.msg_rate)} de los clics genera un mensaje. Revisar el CTA del ad, la experiencia de Messenger/WhatsApp, y que el mensaje automático de bienvenida no sea confuso.`,
    } : {
      ok: (m.lpv_rate ?? 0) >= bench.lpvMin,
      label: `LPV rate ${fmtPct(m.lpv_rate)} vs mín ${bench.lpvMin}%`,
      desc: 'Calidad post-clic',
      fix: `El ${(100 - (m.lpv_rate ?? 0)).toFixed(0)}% de los clics no llegan a cargar la página. Auditar velocidad mobile con PageSpeed. Revisar que la landing no tenga pop-ups o redirects que bloqueen la carga.`,
    },
    {
      ok: hasRetarg && hasProsp,
      label: hasRetarg && hasProsp ? 'Prospección + Retargeting activos' : !hasRetarg ? 'Falta retargeting' : 'Falta prospección',
      desc: 'Estructura de funnel',
      fix: !hasRetarg
        ? 'Crear campaña de retargeting para usuarios que visitaron la landing pero no convirtieron. Audiencia: visitantes 7-14 días. Esto recupera tráfico que ya pagaste.'
        : 'Crear campaña de prospección con audiencia fría (intereses o LAL). Sin prospección no hay tráfico nuevo entrando al funnel.',
    },
  ];

  const score = checks.filter(c => c.ok).length;
  const scoreColor = score >= 4 ? 'text-pgreen' : score >= 3 ? 'text-pamber' : 'text-accent';

  return (
    <section id="scorecard" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">10</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Scorecard de Cuenta</h2>
        <span className={`font-[family-name:var(--font-roboto-mono)] text-sm font-bold ${scoreColor}`}>{score}/5</span>
      </div>
      <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
        <div className="p-5 flex flex-col gap-2">
          {checks.map((c, i) => (
            <div key={i} className={`px-4 py-3 rounded-xl border ${c.ok ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200/50 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30'}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm flex-shrink-0">{c.ok ? '✅' : '⚠️'}</span>
                <div className="flex-1">
                  <div className={`text-xs font-medium ${c.ok ? 'text-pgreen' : 'text-accent'}`}>{c.desc}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{c.label}</div>
                </div>
              </div>
              {!c.ok && (
                <div className="mt-2 ml-8 p-2.5 rounded-lg bg-white/60 dark:bg-zinc-800/60 border border-black/4 dark:border-white/4">
                  <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium text-accent uppercase tracking-widest mb-1">Corrección recomendada</div>
                  <div className="text-xs font-light text-zinc-600 dark:text-zinc-400 leading-relaxed">{c.fix}</div>
                </div>
              )}
            </div>
          ))}
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
      <PlaybooksSection data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <BenchmarksSection data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <DashboardScorecard data={data} />
      <div className="h-px bg-black/6 dark:bg-white/6 my-7" />
      <AIInsightsSection data={data} apiKey={apiKey} bodyRef={aiBodyRef} />
      <div className="h-12" />
    </div>
  );
}
