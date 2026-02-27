'use client';
import { View } from '../lib/types';

interface Props {
  period: string;
  dateStr: string;
  isLive: boolean;
  hasApiKey: boolean;
  onSwitchView: (v: View) => void;
  onToggleTheme: () => void;
  onRunAI: () => void;
  onDashboardPDF: () => void;
  onAuditPDF: () => void;
  onOpenApiKey: () => void;
  isDark: boolean;
}

export default function TopBar({
  period, dateStr, isLive, hasApiKey,
  onSwitchView, onToggleTheme, onRunAI,
  onDashboardPDF, onAuditPDF, onOpenApiKey, isDark,
}: Props) {
  return (
    <div className="h-13 bg-white/84 dark:bg-black/86 backdrop-blur-2xl border-b border-black/6 dark:border-white/6 flex items-center justify-between px-7 sticky top-0 z-40 transition-colors">
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <nav className="text-sm font-light flex items-center gap-2 text-zinc-400 dark:text-zinc-500 tracking-tight">
          <span>Proyecta</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-600 dark:text-zinc-300 font-medium">Meta Ads</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span>{period}</span>
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Status chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 rounded-full text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 tracking-wider">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-pgreen animate-pulse-dot' : 'bg-zinc-400'}`} />
          {dateStr}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 flex items-center justify-center text-sm hover:scale-105 transition-transform"
          title="Cambiar tema"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* API Key config */}
        <button
          onClick={onOpenApiKey}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
            ${hasApiKey
              ? 'bg-green-50 dark:bg-green-950/30 text-pgreen border-green-200 dark:border-green-900/40'
              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-black/6 dark:border-white/8 hover:border-accent hover:text-accent'
            }`}
          title="Configurar Claude API Key"
        >
          {hasApiKey ? '✦ AI lista' : '⚙ API Key'}
        </button>

        <button
          onClick={() => onSwitchView('upload')}
          className="px-4 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/8 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          ↑ CSV
        </button>

        <button
          onClick={onDashboardPDF}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          ⬇ Dashboard PDF
        </button>

        {/* <button
          onClick={onAuditPDF}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-medium hover:bg-accent-hover shadow-[0_2px_8px_rgba(232,52,42,.25)] transition-colors"
        >
          ✦ Auditoría PDF
        </button> */}

        <button
          onClick={onRunAI}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full grad-accent text-white text-sm font-medium shadow-[0_2px_8px_rgba(232,52,42,.3)] hover:opacity-90 transition-opacity"
        >
          ✦ AI Analysis
        </button>
      </div>
    </div>
  );
}
