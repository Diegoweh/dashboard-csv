'use client';
import { useState, useCallback, useRef } from 'react';
import { DashboardData, Industry } from '../lib/types';
import { COL_FIELDS, INDUSTRIES } from '../lib/data';
import { parseCSVText, autoDetectMapping, buildDashboardData, CSVMapping } from '../lib/csvParser';

interface Props {
  onApply: (data: DashboardData) => void;
  onResetDemo: () => void;
}

// Fields visible in the simplified mapping view (core fields only)
const CORE_FIELDS = ['campaign_name', 'amount_spent', 'link_clicks', 'landing_page_views', 'impressions', 'reach', 'frequency'];

export default function UploadView({ onApply, onResetDemo }: Props) {
  const [headers,     setHeaders]     = useState<string[]>([]);
  const [rows,        setRows]        = useState<string[][]>([]);
  const [mapping,     setMapping]     = useState<CSVMapping>({});
  const [filename,    setFilename]    = useState('');
  const [dragging,    setDragging]    = useState(false);
  const [industry,    setIndustry]    = useState<Industry>('Otro');
  const [clientName,  setClientName]  = useState('');
  const [showMapping, setShowMapping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const { headers: h, rows: r } = parseCSVText(e.target?.result as string);
      setHeaders(h);
      setRows(r);
      const detected = autoDetectMapping(h);
      setMapping(detected);

      // Try to extract client name from filename
      const baseName = file.name.replace(/\.csv$/i, '').replace(/[-_]/g, ' ');
      if (!clientName) setClientName(baseName);
    };
    reader.readAsText(file, 'UTF-8');
  }, [clientName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  // Check if required fields are mapped
  const requiredMapped = mapping.campaign_name >= 0 && mapping.amount_spent >= 0;
  const coreMapped = requiredMapped && (mapping.link_clicks >= 0 || mapping.landing_page_views >= 0);
  const mappedCount = Object.values(mapping).filter(v => v >= 0).length;
  const totalFields = Object.keys(mapping).length;

  const handleApply = useCallback(() => {
    if (!rows.length || !requiredMapped) return;
    const data = buildDashboardData(rows, mapping, clientName || filename, industry);
    onApply(data);
  }, [rows, mapping, clientName, filename, industry, requiredMapped, onApply]);

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
          Funciona con cualquier rango de fechas. Las columnas se detectan automáticamente.
        </p>
        <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full grad-accent text-white text-sm font-medium shadow-[0_2px_8px_rgba(232,52,42,.3)]">
          Seleccionar archivo
        </span>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
        <div className="flex gap-2 justify-center flex-wrap mt-5">
          {['Campaña o adset', 'Cualquier período', 'Todas las columnas'].map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-white dark:bg-zinc-800 border border-black/6 dark:border-white/6 text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400 tracking-wide">{t}</span>
          ))}
        </div>
      </div>

      {/* Client & Industry — show immediately after CSV loaded */}
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

      {/* Auto-detection status */}
      {headers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden mb-3.5">
          <div className="px-5 py-3.5 border-b border-black/6 dark:border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${coreMapped ? 'bg-pgreen animate-pulse-dot' : 'bg-pamber'}`} />
              <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {coreMapped ? 'Columnas detectadas correctamente' : 'Revisa el mapeo de columnas'}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-400">{mappedCount}/{totalFields} columnas</span>
              <button
                onClick={() => setShowMapping(!showMapping)}
                className="text-xs px-3 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-black/6 dark:border-white/8 text-zinc-500 hover:text-accent hover:border-accent transition-colors"
              >
                {showMapping ? '▲ Ocultar mapeo' : '▼ Revisar mapeo'}
              </button>
            </div>
          </div>

          {/* Quick summary of detected columns */}
          {!showMapping && (
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {COL_FIELDS.filter(f => CORE_FIELDS.includes(f.key)).map(field => {
                const idx = mapping[field.key];
                const detected = idx !== undefined && idx >= 0;
                return (
                  <span key={field.key} className={`px-2.5 py-1 rounded-full text-[11px] font-[family-name:var(--font-roboto-mono)] border ${
                    detected
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40 text-pgreen'
                      : field.required
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-accent'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-black/6 dark:border-white/6 text-zinc-400'
                  }`}>
                    {detected ? '✓' : field.required ? '✕' : '–'} {field.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Full mapping (collapsible) */}
          {showMapping && (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COL_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-[family-name:var(--font-roboto-mono)]">
                    {field.label}{field.required && ' *'}
                  </label>
                  <select
                    value={mapping[field.key] ?? -1}
                    onChange={e => setMapping(m => ({ ...m, [field.key]: parseInt(e.target.value) }))}
                    className={`px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-xs font-[family-name:var(--font-roboto-mono)] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-accent cursor-pointer transition-colors ${
                      (mapping[field.key] ?? -1) >= 0
                        ? 'border-green-300 dark:border-green-800'
                        : field.required
                        ? 'border-red-300 dark:border-red-800'
                        : 'border-black/6 dark:border-white/8'
                    }`}
                  >
                    <option value={-1}>-- Ignorar --</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Apply buttons */}
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={handleApply}
              disabled={!requiredMapped}
              className={`px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-[0_2px_8px_rgba(232,52,42,.3)] transition-all ${
                requiredMapped && clientName
                  ? 'grad-accent hover:opacity-90 animate-pulse-dot'
                  : requiredMapped
                  ? 'grad-accent hover:opacity-90'
                  : 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed shadow-none'
              }`}
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

      {/* Tip when no file loaded */}
      {headers.length === 0 && (
        <div className="text-center mt-4">
          <p className="text-xs font-light text-zinc-400 leading-relaxed">
            Exporta tu reporte desde Meta Ads Manager con todas las columnas disponibles.<br />
            El sistema detecta automáticamente: Nombre, Gasto, Clics, Impresiones, Alcance, Frecuencia, CTR, CPC, CPM y Landing Page Views.
          </p>
        </div>
      )}
    </div>
  );
}
