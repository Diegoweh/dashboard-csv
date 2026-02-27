'use client';
import { useState } from 'react';

interface Props {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ apiKey, onSave, onClose }: Props) {
  const [value, setValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xl"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/8 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <span className="text-base">✦</span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 tracking-tight">
              Configurar Claude API Key
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-400 hover:bg-red-50 hover:text-accent text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Tu API key de Anthropic. Empieza con <span className="text-accent">sk-ant-</span>. Se guarda solo en tu navegador.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-roboto-mono)] uppercase tracking-wider">
              Claude API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-black/6 dark:border-white/8 text-sm font-[family-name:var(--font-roboto-mono)] text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs transition-colors"
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-pblue text-sm mt-0.5">ℹ</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              La key nunca sale de tu dispositivo — las llamadas a Claude pasan por el servidor de esta app, no por el navegador directamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onSave(value.trim()); onClose(); }}
            disabled={!value.trim().startsWith('sk-ant-')}
            className="flex-1 py-2.5 rounded-xl grad-accent text-sm font-medium text-white shadow-[0_2px_8px_rgba(232,52,42,.3)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Guardar key
          </button>
        </div>
      </div>
    </div>
  );
}
