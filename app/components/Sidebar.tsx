'use client';
import Image from 'next/image';
import { DashboardData, View } from '../lib/types';

interface Props {
  currentView: View;
  data: DashboardData;
  onSwitchView: (v: View) => void;
  onScrollTo: (id: string) => void;
  alertCount: number;
}

const NAV_SECTIONS = [
  { id: 'kpis',      icon: '◎', label: 'KPIs & Métricas' },
  { id: 'funnel',    icon: '▾', label: 'Embudo'          },
  { id: 'campaigns', icon: '≡', label: 'Campañas'        },
  { id: 'creative',  icon: '⬡', label: 'Creative & Fatiga'},
  { id: 'alerts',    icon: '◉', label: 'Alertas'         },
  { id: 'decisions', icon: '⊞', label: 'Decisiones'      },
  { id: 'aiinsights',icon: '✦', label: 'AI Insights'     },
];

export default function Sidebar({ currentView, data, onSwitchView, onScrollTo, alertCount }: Props) {
  const isLive = data.clientName && data.clientName !== 'DEMO';

  return (
    <aside className="w-58 fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white/96 dark:bg-zinc-900/97 border-r border-black/6 dark:border-white/7 backdrop-blur-2xl transition-colors">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-black/6 dark:border-white/6 flex-shrink-0">
        <Image src="/logo_rojo.png" alt="Proyecta" width={120} height={32} className="h-8 w-auto object-contain object-left dark:hidden" />
        <div className="hidden dark:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg grad-accent flex items-center justify-center text-white font-black text-sm flex-shrink-0">P</div>
          <div>
            <div className="text-sm font-bold text-zinc-100 tracking-tight leading-none">Proyecta</div>
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-500 tracking-wider mt-0.5">INTELLIGENCE</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2">
        <p className="px-3 py-3.5 text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium tracking-[1.4px] uppercase text-zinc-400 dark:text-zinc-600">Workspace</p>

        <NavItem active={currentView === 'upload'} onClick={() => onSwitchView('upload')} icon="↑" label="Cargar CSV" />
        <NavItem active={currentView === 'dashboard'} onClick={() => onSwitchView('dashboard')} icon="◈" label="Dashboard" />

        <div className="h-px bg-black/6 dark:bg-white/6 mx-2 my-1.5" />
        <p className="px-3 py-3.5 text-[11px] font-[family-name:var(--font-roboto-mono)] font-medium tracking-[1.4px] uppercase text-zinc-400 dark:text-zinc-600">Análisis</p>

        {NAV_SECTIONS.map(s => (
          <NavItem
            key={s.id}
            active={false}
            onClick={() => onScrollTo(s.id)}
            icon={s.icon}
            label={s.label}
            badge={s.id === 'alerts' && alertCount > 0 ? alertCount : undefined}
          />
        ))}
      </div>

      {/* Footer pill */}
      <div className="p-4 border-t border-black/6 dark:border-white/6 flex-shrink-0">
        <button
          onClick={() => onSwitchView('upload')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/6 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isLive ? 'bg-pgreen shadow-[0_0_0_3px_rgba(26,184,122,.15)] animate-pulse-dot' : 'bg-zinc-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{data.clientName || 'Sin cliente'}</div>
            <div className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 tracking-wider mt-0.5">CAMBIAR CSV</div>
          </div>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ active, onClick, icon, label, badge }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-px text-left transition-colors
        ${active
          ? 'bg-red-50 dark:bg-red-950/30 text-accent font-medium nav-item-active'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
        }`}
    >
      <span className={`text-xs w-4 text-center flex-shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}>{icon}</span>
      <span className="tracking-tight">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto bg-accent text-white text-[11px] font-bold font-[family-name:var(--font-roboto-mono)] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{badge}</span>
      )}
    </button>
  );
}
