export default function Footer() {
  return (
    <footer className="ml-58 border-t border-black/6 dark:border-white/6 bg-white/96 dark:bg-zinc-900/96 px-8 py-6 flex items-center justify-between gap-6 flex-wrap transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg grad-accent flex items-center justify-center text-white font-black text-sm flex-shrink-0">P</div>
        <div>
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">Proyecta Intelligence</div>
          <div className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 uppercase tracking-widest mt-0.5">Meta Ads Analytics · V7.0</div>
        </div>
        <div className="w-px h-8 bg-black/8 dark:bg-white/8 hidden sm:block" />
        <div className="hidden sm:flex gap-7">
          {[
            { label: 'Agencia',  val: 'Proyecta Igniting Marketing' },
            { label: 'País',     val: 'México'                      },
            { label: 'Web',      val: 'proyecta.com.mx'             },
          ].map(item => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 uppercase tracking-widest">{item.label}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.val}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] font-[family-name:var(--font-roboto-mono)] text-zinc-400 uppercase tracking-widest">Proyecta Intelligence · V7.0 · 2025</span>
        <span className="text-xs font-light text-zinc-400">© Proyecta Igniting Marketing · Todos los derechos reservados</span>
      </div>
    </footer>
  );
}
