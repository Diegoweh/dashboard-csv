'use client';
import { useState, useCallback, useRef } from 'react';
import { DashboardData, Industry } from '../lib/types';
import { COL_FIELDS, INDUSTRIES } from '../lib/data';
import { parseCSVText, autoDetectMapping, buildDashboardData, CSVMapping } from '../lib/csvParser';

interface Props {
  onApply: (data: DashboardData) => void;
  onResetDemo: () => void;
}

export default function UploadView({ onApply, onResetDemo }: Props) {
  const [headers,   setHeaders]   = useState<string[]>([]);
  const [rows,      setRows]      = useState<string[][]>([]);
  const [mapping,   setMapping]   = useState<CSVMapping>({});
  const [filename,  setFilename]  = useState('');
  const [dragging,  setDragging]  = useState(false);
  const [industry,  setIndustry]  = useState<Industry>('Otro');
  const [clientName, setClientName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows } = parseCSVText(e.target?.result as string);
      setHeaders(headers);
      setRows(rows);
      setMapping(autoDetectMapping(headers));
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleApply = () => {
    if (!rows.length) return;
    const data = buildDashboardData(rows, mapping, clientName || filename, industry);
    onApply(data);
  };

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`grad-hero dark:bg-zinc-900 rounded-3xl px-11 py-14 text-center border-2 border-dashed cursor-pointer transition-all mb-3.5
          ${dragging ? 'border-accent shadow-[0_0_0_4px_rgba(232,52,42,.1)]' : 'border-black/10 dark:border-white/10 hover:border-accent hover:shadow-[0_0_0_3px_rgba(232,52,42,.06)]'}`}
      >
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-2xl">📊</div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight mb-2">Arrastra tu CSV de Meta Ads aquí</h2>
        <p className="text-sm font-light text-zinc-400 dark:text-zinc-500 leading-relaxed mb-6">
          Exporta desde Meta Ads Manager a nivel de campaña o adset.<br />
          Se recomienda rango de 1 semana o 15 días para análisis óptimo.
        </p>
        <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full grad-accent text-white text-sm font-medium shadow-[0_2px_8px_rgba(232,52,42,.3)]">
          Seleccionar archivo
        </span>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
        <div className="flex gap-2 justify-center flex-wrap mt-5">
          {['Campaña o adset', '1 semana / 15 días', 'Todas las columnas'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-black/6 dark:border-white/6 text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 tracking-wide">{t}</span>
          ))}
        </div>
      </div>

      {/* CSV Preview */}
      {headers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden mb-3.5">
          <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6 flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Vista previa del CSV</h4>
            <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">{rows.length} filas</span>
          </div>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-xs font-[family-name:var(--font-roboto-mono)]">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 uppercase tracking-wider whitespace-nowrap sticky top-0 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-black/4 dark:border-white/4">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client & Industry */}
      {headers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden mb-3.5">
          <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6 flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Contexto del cliente</h4>
            <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">Los benchmarks cambian según la industria</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-roboto-mono)]">Nombre del cliente *</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ej: Gran Acuario Mazatlán"
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/8 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-roboto-mono)]">Industria *</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value as Industry)}
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/8 rounded-xl text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-accent cursor-pointer transition-colors"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping */}
      {headers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6 flex items-center justify-between">
            <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Mapeo de columnas</h4>
            <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">Asigna las columnas del CSV</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COL_FIELDS.map(field => (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-roboto-mono)]">
                  {field.label}{field.required && ' *'}
                </label>
                <select
                  value={mapping[field.key] ?? -1}
                  onChange={e => setMapping(m => ({ ...m, [field.key]: parseInt(e.target.value) }))}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/8 rounded-xl text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-accent cursor-pointer transition-colors"
                >
                  <option value={-1}>-- Ignorar --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-full grad-accent text-white text-sm font-medium shadow-[0_2px_8px_rgba(232,52,42,.3)] hover:opacity-90 transition-opacity"
            >
              ▶ Aplicar al dashboard
            </button>
            <button
              onClick={onResetDemo}
              className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              ↩ Resetear demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
