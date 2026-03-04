'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiRule {
  label: string;
  dist: { tofu: number; mofu: number; bofu: number; retencion: number };
  desc_dist: string;
  minBOFU?: number;
  minMOFU_BOFU?: number;
  minTOFU?: number;
  minRET?: number;
  desc: string;
}

interface FunnelWeek {
  semana: string;
  obj_meta: string;
  fase: string;
  pct: number;
  razon: string;
}

interface Post {
  dia: string;
  etapa: string;
  objetivo: string;
  formato: string;
  tema: string;
  copy_estructurado: Record<string, unknown>;
  cta: string;
  visual: string;
  justificacion: string;
  es_anti_objecion: boolean;
}

interface OrgSemana {
  titulo: string;
  sync_ads: string;
  posts: Post[];
}

interface CalOrg {
  resumen: {
    total_posts: number;
    tofu: number;
    mofu: number;
    bofu: number;
    retencion: number;
    narrativa: string;
    posts_clave: string[];
  };
  semanas: OrgSemana[];
  alertas: Array<{ tipo: string; mensaje: string }>;
}

interface AdCopy {
  headline: string;
  texto_principal: string;
  descripcion: string;
  cta_boton: string;
  variable_test: string;
}

interface BriefCreativo {
  formato: string;
  duracion?: string;
  mensaje_principal: string;
  que_mostrar: string;
  que_NO_mostrar: string;
  texto_en_video?: string;
  referencia_visual?: string;
}

interface Conjunto {
  nombre: string;
  tipo_audiencia: string;
  audiencia: {
    edad_min: number;
    edad_max: number;
    genero: string;
    ubicaciones: string[];
    intereses_incluir: string[];
    intereses_excluir: string[];
    comportamientos: string[];
    audiencias_personalizadas: string[];
  };
  copy_a: AdCopy;
  copy_b: AdCopy;
  brief_creativo: BriefCreativo;
}

interface AdsSemana {
  semana: string;
  objetivo_meta: string;
  fase_funnel: string;
  presupuesto_semana: number;
  presupuesto_diario: number;
  justificacion: string;
  conjuntos: Conjunto[];
  reglas_decision: Array<{ condicion: string; accion: string }>;
  sync_organico: string;
}

interface CalAds {
  plan_ads: {
    presupuesto_total: number;
    mes: string;
    narrativa_estrategica: string;
  };
  semanas: AdsSemana[];
}

interface BriefingData {
  cliente: string;
  industria: string;
  kpi: string;
  rule: KpiRule;
  kpi2: string;
  rule2: KpiRule | null;
  posteos: number;
  dist: { tofu: number; mofu: number; bofu: number; retencion: number };
  funnel: FunnelWeek[];
  plats: string;
  diasOptimos: string[];
  presupuesto: number;
  mes: string;
  segmento: string;
  pain: string;
  objecion: string;
  motivacion: string;
  tono: string;
  pixel: string;
  audiencias_custom: string;
  temporada: string;
  historial: string;
  restricciones: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KPI_RULES: Record<string, KpiRule> = {
  mensajes_ventas: { label: 'Mensajes / Ventas directas', dist: { tofu: 2, mofu: 4, bofu: 4, retencion: 2 }, desc_dist: 'TOFU 2, MOFU 4, BOFU 4, RET 2', minBOFU: 30, minMOFU_BOFU: 55, desc: '≥30% BOFU y ≥55% MOFU+BOFU.' },
  reservaciones:   { label: 'Reservaciones / Citas',      dist: { tofu: 2, mofu: 5, bofu: 4, retencion: 1 }, desc_dist: 'TOFU 2, MOFU 5, BOFU 4, RET 1', minBOFU: 25, minMOFU_BOFU: 60, desc: '≥60% combinado MOFU+BOFU.' },
  trafico_web:     { label: 'Tráfico web / Landing',       dist: { tofu: 3, mofu: 4, bofu: 3, retencion: 2 }, desc_dist: 'TOFU 3, MOFU 4, BOFU 3, RET 2', minBOFU: 20, minMOFU_BOFU: 45, desc: '≥45% combinado MOFU+BOFU.' },
  awareness:       { label: 'Awareness / Seguidores',      dist: { tofu: 5, mofu: 4, bofu: 2, retencion: 1 }, desc_dist: 'TOFU 5, MOFU 4, BOFU 2, RET 1', minTOFU: 40, desc: '≥40% TOFU.' },
  retencion:       { label: 'Retención / Recompra',        dist: { tofu: 2, mofu: 4, bofu: 3, retencion: 3 }, desc_dist: 'TOFU 2, MOFU 4, BOFU 3, RET 3', minRET: 25, desc: '≥25% Retención.' },
  leads:           { label: 'Leads / Formularios',         dist: { tofu: 3, mofu: 5, bofu: 3, retencion: 1 }, desc_dist: 'TOFU 3, MOFU 5, BOFU 3, RET 1', minMOFU_BOFU: 65, desc: '≥65% MOFU+BOFU.' },
};

const INDUSTRY_FUNNEL: Record<string, FunnelWeek[]> = {
  'Turismo / Atracción': [
    { semana: 'Semana 1', obj_meta: 'Alcance',       fase: 'TOFU',  pct: 20, razon: 'Generar awareness masivo antes de temporada' },
    { semana: 'Semana 2', obj_meta: 'Tráfico',        fase: 'MOFU',  pct: 30, razon: 'Llevar audiencia cálida al sitio/landing' },
    { semana: 'Semana 3', obj_meta: 'Conversiones',   fase: 'BOFU',  pct: 30, razon: 'Convertir interesados con oferta clara' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 20, razon: 'Recuperar visitantes sin conversión + urgencia' },
  ],
  'Hotel / Hospedaje': [
    { semana: 'Semana 1', obj_meta: 'Alcance',       fase: 'TOFU',  pct: 20, razon: 'Brand awareness + temporada o fecha especial' },
    { semana: 'Semana 2', obj_meta: 'Mensajes',       fase: 'MOFU',  pct: 25, razon: 'Generar consultas directas de interesados' },
    { semana: 'Semana 3', obj_meta: 'Conversiones',   fase: 'BOFU',  pct: 30, razon: 'Reservas directas con CTA específico' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 25, razon: 'Retargeting visitantes + audiencia similar a huéspedes' },
  ],
  'Food & Lifestyle': [
    { semana: 'Semana 1', obj_meta: 'Alcance',       fase: 'TOFU',  pct: 25, razon: 'Mostrar producto/experiencia a audiencia nueva' },
    { semana: 'Semana 2', obj_meta: 'Interacción',    fase: 'MOFU',  pct: 25, razon: 'Engagement con oferta o contenido viral' },
    { semana: 'Semana 3', obj_meta: 'Mensajes',       fase: 'BOFU',  pct: 30, razon: 'Pedidos directos o reservas de mesa' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 20, razon: 'Recuperar audiencia cálida que no convirtió' },
  ],
  'Healthcare / Salud': [
    { semana: 'Semana 1', obj_meta: 'Tráfico',        fase: 'TOFU',  pct: 25, razon: 'Educar y generar tráfico a contenido de valor' },
    { semana: 'Semana 2', obj_meta: 'Mensajes',       fase: 'MOFU',  pct: 30, razon: 'Generar consultas y agendar citas' },
    { semana: 'Semana 3', obj_meta: 'Mensajes',       fase: 'BOFU',  pct: 30, razon: 'Citas directas + superar objeción de confianza' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 15, razon: 'Retargeting visitantes sin agendar' },
  ],
  'B2B / Servicios': [
    { semana: 'Semana 1', obj_meta: 'Tráfico',        fase: 'TOFU',  pct: 25, razon: 'Generar tráfico a contenido de autoridad' },
    { semana: 'Semana 2', obj_meta: 'Tráfico',        fase: 'MOFU',  pct: 25, razon: 'Lead magnet o demo a audiencia interesada' },
    { semana: 'Semana 3', obj_meta: 'Conversiones',   fase: 'BOFU',  pct: 30, razon: 'Leads calificados o solicitud de propuesta' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 20, razon: 'Retargeting de visitantes y leads fríos' },
  ],
  'Retail / Comercio': [
    { semana: 'Semana 1', obj_meta: 'Alcance',       fase: 'TOFU',  pct: 20, razon: 'Reach masivo: producto + oferta del mes' },
    { semana: 'Semana 2', obj_meta: 'Tráfico',        fase: 'MOFU',  pct: 25, razon: 'Llevar tráfico a tienda o catálogo online' },
    { semana: 'Semana 3', obj_meta: 'Conversiones',   fase: 'BOFU',  pct: 35, razon: 'Ventas directas + urgencia temporal' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 20, razon: 'Carritos abandonados + clientes anteriores' },
  ],
  'Ecommerce': [
    { semana: 'Semana 1', obj_meta: 'Tráfico',        fase: 'TOFU',  pct: 20, razon: 'Llevar tráfico frío a la tienda online / landing de producto' },
    { semana: 'Semana 2', obj_meta: 'Conversiones',   fase: 'MOFU',  pct: 25, razon: 'Conversiones a audiencia que ya visitó la tienda' },
    { semana: 'Semana 3', obj_meta: 'Conversiones',   fase: 'BOFU',  pct: 35, razon: 'Campaña de ventas con oferta / urgencia + catálogo dinámico' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 20, razon: 'Retargeting carritos abandonados + compradores anteriores (upsell)' },
  ],
  'Otro': [
    { semana: 'Semana 1', obj_meta: 'Alcance',       fase: 'TOFU',  pct: 25, razon: 'Generar awareness del negocio' },
    { semana: 'Semana 2', obj_meta: 'Tráfico',        fase: 'MOFU',  pct: 25, razon: 'Educar y generar consideración' },
    { semana: 'Semana 3', obj_meta: 'Conversiones',   fase: 'BOFU',  pct: 30, razon: 'Conversión directa al KPI principal' },
    { semana: 'Semana 4', obj_meta: 'Retargeting',    fase: 'BOFU+', pct: 20, razon: 'Retargeting de audiencia cálida' },
  ],
};

const DIAS_OPTIMOS: Record<string, string[]> = {
  'Instagram':      ['Martes', 'Miércoles', 'Viernes'],
  'Facebook':       ['Miércoles', 'Jueves', 'Sábado'],
  'TikTok':         ['Lunes', 'Jueves', 'Domingo'],
  'LinkedIn':       ['Martes', 'Miércoles', 'Jueves'],
  'YouTube Shorts': ['Viernes', 'Sábado', 'Domingo'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON(raw: string): unknown {
  if (!raw?.trim()) throw new Error('Respuesta vacía de la API.');
  const f = raw.indexOf('{'), l = raw.lastIndexOf('}');
  if (f === -1 || l === -1) throw new Error('Sin JSON en la respuesta. Reintenta.');
  const slice = raw.slice(f, l + 1);

  try { return JSON.parse(slice); } catch (_) { /* continue */ }

  try {
    const fx = slice
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\\'/g, "'");
    return JSON.parse(fx);
  } catch (_) { /* continue */ }

  try {
    const opens: string[] = [];
    for (const ch of slice) {
      if (ch === '{') opens.push('}');
      else if (ch === '[') opens.push(']');
      else if (ch === '}' || ch === ']') opens.pop();
    }
    const closed = slice + opens.reverse().join('');
    return JSON.parse(closed.replace(/,\s*([}\]])/g, '$1'));
  } catch (_) { /* continue */ }

  throw new Error('JSON inválido después de 3 intentos de reparación. Reintenta o reduce el número de posteos.');
}

async function callAPI(prompt: string): Promise<unknown> {
  const res = await fetch('/api/calendario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return parseJSON(json.text);
}

async function callWithRetry(prompt: string, label: string, maxRetries = 2): Promise<unknown> {
  let lastErr: Error = new Error('Unknown');
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 3000));
      return await callAPI(prompt);
    } catch (e) {
      lastErr = e as Error;
      if (lastErr.message.includes('authentication') || lastErr.message.includes('API key')) throw lastErr;
    }
  }
  throw new Error(`${label}: ${lastErr.message}`);
}

function fmtMXN(n: number) {
  return '$' + (Math.round(n) || 0).toLocaleString('es-MX') + ' MXN';
}

function etapaBorderColor(e: string): string {
  const m: Record<string, string> = { TOFU: '#3A7BD5', MOFU: '#F0A500', BOFU: '#E8342A', RETENCION: '#1AB87A', RETENCIÓN: '#1AB87A' };
  return m[e?.toUpperCase()] || '#3A7BD5';
}

function etapaLabel(e: string) {
  const m: Record<string, string> = { TOFU: '🔵 Atracción', MOFU: '🟡 Consideración', BOFU: '🟠 Conversión', RETENCION: '🟢 Retención', RETENCIÓN: '🟢 Retención' };
  return m[e?.toUpperCase()] || e;
}

function etapaBadgeStyle(e: string): { background: string; color: string } {
  const m: Record<string, [string, string]> = {
    TOFU:      ['rgba(58,123,213,.12)', '#3A7BD5'],
    MOFU:      ['rgba(240,165,0,.12)',  '#B07800'],
    BOFU:      ['rgba(232,52,42,.12)',  '#E8342A'],
    RETENCION: ['rgba(26,184,122,.12)', '#12875A'],
    RETENCIÓN: ['rgba(26,184,122,.12)', '#12875A'],
  };
  const [bg, color] = m[e?.toUpperCase()] || ['rgba(58,123,213,.12)', '#3A7BD5'];
  return { background: bg, color };
}

function fmtBadgeClass(fmt: string) {
  const f = (fmt || '').toLowerCase();
  if (f.includes('reel'))                              return 'fmt-reel';
  if (f.includes('video'))                             return 'fmt-video';
  if (f.includes('carrusel'))                          return 'fmt-carrusel';
  if (f.includes('historia') || f.includes('story'))  return 'fmt-historia';
  if (f.includes('imagen') || f.includes('estático') || f.includes('estatico')) return 'fmt-imagen';
  return 'fmt-default';
}

function objMetaBadgeStyle(obj: string): { background: string; color: string } {
  const m: Record<string, [string, string]> = {
    'Alcance':      ['rgba(58,123,213,.12)', '#3A7BD5'],
    'Tráfico':      ['rgba(240,165,0,.12)',  '#B07800'],
    'Conversiones': ['rgba(232,52,42,.12)',  '#E8342A'],
    'Mensajes':     ['rgba(26,184,122,.12)', '#12875A'],
    'Retargeting':  ['rgba(124,58,237,.12)', '#7C3AED'],
    'Interacción':  ['rgba(0,194,255,.12)',  '#0088b3'],
  };
  const [bg, color] = m[obj] || ['rgba(232,52,42,.12)', '#E8342A'];
  return { background: bg, color };
}

function alertBorderClass(tipo: string) {
  return { fecha_clave: 'border-l-pblue', produccion: 'border-l-pamber', riesgo: 'border-l-accent' }[tipo] || 'border-l-pamber';
}

function alertIcon(t: string) {
  return ({ fecha_clave: '📅', produccion: '🎬', riesgo: '⚠️' } as Record<string, string>)[t] || '💡';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyBlock({ post }: { post: Post }) {
  const c = post.copy_estructurado;
  if (!c || Object.keys(c).length === 0) return null;

  const fmt = (post.formato || '').toLowerCase();
  const isReel     = fmt.includes('reel') || fmt.includes('video') || fmt.includes('tiktok');
  const isCarrusel = fmt.includes('carrusel');
  const isStory    = fmt.includes('historia') || fmt.includes('story');

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="mb-1.5 last:mb-0">
      <div className="text-[9px] font-bold text-accent uppercase tracking-[0.8px] mb-0.5">{label}</div>
      <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">{value}</div>
    </div>
  );

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 mb-2 border border-black/6 dark:border-white/6">
      <div className="text-[9px] font-bold uppercase tracking-[1.2px] text-zinc-400 dark:text-zinc-500 mb-2">✍️ Copy — {post.formato}</div>

      {isReel && (
        <>
          {c.gancho      && <Field label="⚡ Gancho (0–3 seg)" value={c.gancho as string} />}
          {Array.isArray(c.guion_escenas) && c.guion_escenas.length > 0 && (
            <div className="mb-1.5">
              <div className="text-[9px] font-bold text-accent uppercase tracking-[0.8px] mb-0.5">🎬 Guión</div>
              {(c.guion_escenas as string[]).map((e, i) => (
                <div key={i} className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed mb-0.5">
                  <strong>{i + 1}.</strong> {e}
                </div>
              ))}
            </div>
          )}
          {c.cta_hablado && <Field label="📣 CTA hablado" value={c.cta_hablado as string} />}
        </>
      )}

      {isCarrusel && (
        <>
          {c.titulo_slide1 && <Field label="🖼 Slide 1" value={c.titulo_slide1 as string} />}
          {Array.isArray(c.slides) && c.slides.length > 0 && (
            <div className="mb-1.5">
              <div className="text-[9px] font-bold text-accent uppercase tracking-[0.8px] mb-0.5">📋 Slides</div>
              {(c.slides as Array<{ numero: number; texto: string }>).map((s, i) => (
                <div key={i} className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed mb-0.5">
                  <strong>{s.numero}.</strong> {s.texto}
                </div>
              ))}
            </div>
          )}
          {c.cta_ultimo_slide && <Field label="📣 CTA final" value={c.cta_ultimo_slide as string} />}
        </>
      )}

      {isStory && (
        <>
          {c.texto_superpuesto && <Field label="📝 Texto en pantalla" value={c.texto_superpuesto as string} />}
          {c.accion_link       && <Field label="🔗 Link"              value={c.accion_link as string} />}
        </>
      )}

      {!isReel && !isCarrusel && !isStory && (
        <>
          {c.texto_arte && <Field label="🖼 Arte"    value={c.texto_arte as string} />}
          {c.caption    && <Field label="✍️ Caption" value={c.caption    as string} />}
          {c.cta        && <Field label="📣 CTA"     value={c.cta        as string} />}
        </>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const isObj = post.es_anti_objecion;
  const borderColor = isObj ? '#7C3AED' : etapaBorderColor(post.etapa);

  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 border border-black/6 dark:border-white/6 shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.09)] transition-shadow fade-in"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.6px] mb-0.5">{post.dia}</div>
          <div className="font-[family-name:var(--font-cond)] text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{post.tema}</div>
        </div>
        <div className="flex gap-1 flex-wrap justify-end flex-shrink-0">
          {isObj
            ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,.10)', color: '#7C3AED' }}>🛡️ Anti-objeción</span>
            : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={etapaBadgeStyle(post.etapa)}>{etapaLabel(post.etapa)}</span>
          }
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${fmtBadgeClass(post.formato)}`}>{post.formato}</span>
        </div>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed">🎯 {post.objetivo}</div>
      <CopyBlock post={post} />
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-black/5 dark:border-white/5 leading-relaxed">
        <span>📣 {post.cta}</span>
        <span>🎨 {post.visual}</span>
        <span>💡 {post.justificacion}</span>
      </div>
    </div>
  );
}

function AdsCopyBlock({ copy, variant }: { copy: AdCopy; variant: 'A' | 'B' }) {
  const isB = variant === 'B';
  return (
    <div className={`rounded-lg p-2.5 border mb-2 ${isB ? 'border-pblue/30 bg-pblue/[.04]' : 'bg-zinc-50 dark:bg-zinc-800 border-black/6 dark:border-white/6'}`}>
      <div className={`text-[10px] font-bold uppercase tracking-[0.8px] mb-2 ${isB ? 'text-pblue' : 'text-accent'}`}>
        📝 Variante {variant} — {copy.variable_test || `Copy ${variant === 'A' ? 'principal' : 'alternativo'}`}
      </div>
      {[
        { l: 'Headline',        v: copy.headline,        hint: 'máx 40 chars' },
        { l: 'Texto principal', v: copy.texto_principal, hint: undefined      },
        { l: 'Descripción',     v: copy.descripcion,     hint: undefined      },
        { l: 'Botón CTA',       v: copy.cta_boton,       hint: undefined      },
      ].filter(f => f.v).map(f => (
        <div key={f.l} className="mb-1.5 last:mb-0">
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.8px] mb-0.5">{f.l}</div>
          <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">{f.v}</div>
          {f.hint && <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{f.hint}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── KPI validator ────────────────────────────────────────────────────────────

function validarKPI(kpi: string, r: CalOrg['resumen'] | undefined) {
  if (!r || !KPI_RULES[kpi]) return null;
  const rule = KPI_RULES[kpi];
  const t = r.total_posts || 1;
  const issues: string[] = [];
  const pB  = (r.bofu / t) * 100;
  const pT  = (r.tofu / t) * 100;
  const pR  = (r.retencion / t) * 100;
  const pMB = ((r.mofu + r.bofu) / t) * 100;
  if (rule.minBOFU     && pB  < rule.minBOFU)     issues.push(`BOFU ${pB.toFixed(0)}% vs ${rule.minBOFU}% requerido`);
  if (rule.minMOFU_BOFU && pMB < rule.minMOFU_BOFU) issues.push(`MOFU+BOFU ${pMB.toFixed(0)}% vs ${rule.minMOFU_BOFU}% requerido`);
  if (rule.minTOFU     && pT  < rule.minTOFU)     issues.push(`TOFU ${pT.toFixed(0)}% vs ${rule.minTOFU}% requerido`);
  if (rule.minRET      && pR  < rule.minRET)      issues.push(`RET ${pR.toFixed(0)}% vs ${rule.minRET}% requerido`);
  return { ok: issues.length === 0, issues, rule };
}

// ─── Output panels ────────────────────────────────────────────────────────────

function OrganicoPanel({ calOrg, d }: { calOrg: CalOrg; d: BriefingData }) {
  const r = calOrg.resumen || {} as CalOrg['resumen'];
  const kv = validarKPI(d.kpi, r);

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-black/6 dark:border-white/6 shadow-[0_1px_4px_rgba(0,0,0,0.07)] fade-in">
        <div className="font-[family-name:var(--font-cond)] text-lg font-bold text-zinc-900 dark:text-zinc-100">{d.cliente}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {d.mes} · {r.total_posts || 0} posts orgánicos · {d.plats}
          {d.kpi2 && d.rule2 ? ` · KPI2: ${d.rule2.label}` : ''}
        </div>
      </div>

      {/* KPI validation alert */}
      {kv && (
        <div className={`rounded-xl p-3 flex items-start gap-2.5 text-xs leading-relaxed border-l-[2.5px] ${
          kv.ok ? 'bg-pgreen/[.08] border-l-pgreen' : kv.issues.length > 1 ? 'bg-accent/[.07] border-l-accent' : 'bg-pamber/[.08] border-l-pamber'
        }`}>
          <span>{kv.ok ? '✅' : kv.issues.length > 1 ? '🔴' : '⚠️'}</span>
          <div>
            <div className="font-semibold mb-0.5 text-zinc-800 dark:text-zinc-200">
              {kv.ok ? `Distribución correcta para: ${kv.rule.label}` : 'Distribución fuera del objetivo — regenerar recomendado'}
            </div>
            {kv.ok
              ? <span>{kv.rule.desc_dist}</span>
              : <><div>{kv.issues.map(i => `• ${i}`).join(' · ')}</div><div className="opacity-70 mt-1">Solicitada: {kv.rule.desc_dist}</div></>
            }
          </div>
        </div>
      )}

      {/* Funnel cards */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { key: 'tofu',      label: 'Atracción',    color: '#3A7BD5', stage: 'TOFU'      },
          { key: 'mofu',      label: 'Consideración', color: '#F0A500', stage: 'MOFU'      },
          { key: 'bofu',      label: 'Conversión',   color: '#E8342A', stage: 'BOFU'      },
          { key: 'retencion', label: 'Retención',    color: '#1AB87A', stage: 'Comunidad' },
        ].map(f => (
          <div
            key={f.key}
            className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-black/6 dark:border-white/6 shadow-[0_1px_4px_rgba(0,0,0,0.07)] border-t-[2.5px] hover:-translate-y-0.5 transition-transform"
            style={{ borderTopColor: f.color }}
          >
            <div className="text-[9px] font-bold uppercase tracking-[1px] text-zinc-400 mb-0.5">{f.label}</div>
            <div className="font-[family-name:var(--font-cond)] text-3xl font-bold leading-none" style={{ color: f.color }}>
              {(r as unknown as Record<string, number>)[f.key] || 0}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{f.stage}</div>
          </div>
        ))}
      </div>

      {/* Weekly posts */}
      {(calOrg.semanas || []).map((semana, si) => (
        <div key={si}>
          {semana.sync_ads && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 mb-2" style={{ background: 'rgba(240,165,0,.06)', border: '1px solid rgba(240,165,0,.2)' }}>
              <span className="flex-shrink-0">🔗</span>
              <span><strong>Ads esta semana:</strong> {semana.sync_ads}</span>
            </div>
          )}
          <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-zinc-500 dark:text-zinc-400 mb-2">📅 {semana.titulo}</div>
          <div className="flex flex-col gap-2">
            {(semana.posts || []).map((post, pi) => <PostCard key={pi} post={post} />)}
          </div>
        </div>
      ))}

      {/* Summary card */}
      {r.narrativa && (
        <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: '#1C1C1E' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#E8342A 0%,#F0A500 50%,#E8342A 100%)' }} />
          <div className="font-[family-name:var(--font-cond)] text-base font-bold text-white mb-2">✦ Resumen Estratégico</div>
          <div className="text-xs text-white/75 leading-7 whitespace-pre-line">
            {r.narrativa}
            {(r.posts_clave || []).length > 0 && `\n\nPosts clave:\n${r.posts_clave.map((p, i) => `${i + 1}. ${p}`).join('\n')}`}
          </div>
        </div>
      )}

      {/* Alerts */}
      {(calOrg.alertas || []).length > 0 && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.8px] text-zinc-500 dark:text-zinc-400 mb-2">⚠️ Alertas</div>
          <div className="flex flex-col gap-2">
            {calOrg.alertas.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 shadow-[0_1px_4px_rgba(0,0,0,0.07)] text-xs border-l-[2.5px] ${alertBorderClass(a.tipo)}`}>
                <span className="text-sm flex-shrink-0">{alertIcon(a.tipo)}</span>
                <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{a.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdsPanel({ calAds, d }: { calAds: CalAds; d: BriefingData }) {
  const p = calAds.plan_ads || {} as CalAds['plan_ads'];

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-black/6 dark:border-white/6 shadow-[0_1px_4px_rgba(0,0,0,0.07)] fade-in">
        <div className="font-[family-name:var(--font-cond)] text-lg font-bold text-zinc-900 dark:text-zinc-100">Plan Meta Ads — {d.cliente}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {d.mes} · Presupuesto total: {fmtMXN(p.presupuesto_total || d.presupuesto)} · {d.rule.label}
        </div>
      </div>

      {/* Strategy summary */}
      {p.narrativa_estrategica && (
        <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: '#1C1C1E' }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#E8342A 0%,#F0A500 50%,#E8342A 100%)' }} />
          <div className="font-[family-name:var(--font-cond)] text-base font-bold text-white mb-2">🧠 Estrategia del mes</div>
          <div className="text-xs text-white/75 leading-relaxed">{p.narrativa_estrategica}</div>
        </div>
      )}

      {/* Weekly plans */}
      {(calAds.semanas || []).map((sem, si) => {
        const presD = sem.presupuesto_diario || Math.round((sem.presupuesto_semana || 0) / 7);
        return (
          <div
            key={si}
            className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-black/6 dark:border-white/6 shadow-[0_1px_4px_rgba(0,0,0,0.07)] fade-in"
            style={{ borderLeft: '3px solid #E8342A' }}
          >
            {/* Week header */}
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <span className="font-[family-name:var(--font-cond)] text-base font-bold text-zinc-900 dark:text-zinc-100">{sem.semana}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.5px]" style={objMetaBadgeStyle(sem.objetivo_meta)}>{sem.objetivo_meta}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{sem.fase_funnel}</span>
              <span className="ml-auto text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{fmtMXN(sem.presupuesto_semana)} · ~{fmtMXN(presD)}/día</span>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 mb-3 leading-relaxed border border-black/5 dark:border-white/5">
              {sem.justificacion}
            </div>

            {/* Ad sets */}
            {(sem.conjuntos || []).map((cj, ci) => {
              const aud = cj.audiencia || {} as Conjunto['audiencia'];
              return (
                <div key={ci} className="border border-black/8 dark:border-white/8 rounded-xl p-3 mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex-wrap">
                    {cj.nombre}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.5px] ${
                      cj.tipo_audiencia === 'fria' ? 'bg-pblue/[.10] text-pblue' : 'bg-pgreen/[.10] text-pgreen'
                    }`}>
                      {cj.tipo_audiencia === 'fria' ? 'Audiencia fría' : 'Audiencia cálida'}
                    </span>
                  </div>

                  {/* Audience grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 border border-black/5 dark:border-white/5">
                      <div className="text-[9px] font-bold uppercase tracking-[1px] text-zinc-400 mb-1.5">👥 Audiencia base</div>
                      <div className="text-[11px] text-zinc-700 dark:text-zinc-300">Edad: {aud.edad_min}–{aud.edad_max} · {aud.genero}</div>
                      {(aud.ubicaciones || []).map((u, i) => <div key={i} className="text-[11px] text-zinc-700 dark:text-zinc-300">{u}</div>)}
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 border border-black/5 dark:border-white/5">
                      <div className="text-[9px] font-bold uppercase tracking-[1px] text-zinc-400 mb-1.5">✅ Intereses</div>
                      {(aud.intereses_incluir || []).map((item, i) => (
                        <div key={i} className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-1">
                          <span className="text-zinc-400 flex-shrink-0">•</span>{item}
                        </div>
                      ))}
                    </div>
                    {(aud.intereses_excluir || []).length > 0 && (
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 border border-black/5 dark:border-white/5">
                        <div className="text-[9px] font-bold uppercase tracking-[1px] text-zinc-400 mb-1.5">🚫 Excluir</div>
                        {aud.intereses_excluir.map((item, i) => (
                          <div key={i} className="text-[11px] text-accent flex items-start gap-1">✕ {item}</div>
                        ))}
                      </div>
                    )}
                    {(aud.comportamientos || []).length > 0 && (
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 border border-black/5 dark:border-white/5">
                        <div className="text-[9px] font-bold uppercase tracking-[1px] text-zinc-400 mb-1.5">🎯 Comportamientos</div>
                        {aud.comportamientos.map((item, i) => (
                          <div key={i} className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-start gap-1">
                            <span className="text-zinc-400 flex-shrink-0">•</span>{item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {cj.copy_a && <AdsCopyBlock copy={cj.copy_a} variant="A" />}
                  {cj.copy_b && <AdsCopyBlock copy={cj.copy_b} variant="B" />}

                  {/* Creative brief */}
                  {cj.brief_creativo && (
                    <div className="rounded-lg p-2.5 border mt-1" style={{ background: 'rgba(124,58,237,.05)', borderColor: 'rgba(124,58,237,.2)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-[0.8px] mb-2" style={{ color: '#7C3AED' }}>🎨 Brief para diseñador</div>
                      {([
                        { l: 'Formato',          v: cj.brief_creativo.formato           },
                        cj.brief_creativo.duracion && { l: 'Duración', v: cj.brief_creativo.duracion },
                        { l: 'Mensaje principal', v: cj.brief_creativo.mensaje_principal },
                        { l: 'Qué mostrar',      v: cj.brief_creativo.que_mostrar       },
                        { l: 'Qué NO mostrar',   v: cj.brief_creativo.que_NO_mostrar    },
                        cj.brief_creativo.texto_en_video    && { l: 'Texto en video', v: cj.brief_creativo.texto_en_video    },
                        cj.brief_creativo.referencia_visual && { l: 'Referencia',    v: cj.brief_creativo.referencia_visual },
                      ] as Array<{ l: string; v: string } | false>)
                        .filter((f): f is { l: string; v: string } => !!f && !!f.v)
                        .map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5 mb-1 last:mb-0 text-xs text-zinc-700 dark:text-zinc-300">
                            <span style={{ color: '#7C3AED' }} className="flex-shrink-0">→</span>
                            <span><strong>{f.l}:</strong> {f.v}</span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              );
            })}

            {/* Decision rules */}
            {(sem.reglas_decision || []).length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-zinc-400 mb-2">🎯 Reglas de decisión — fin de semana</div>
                {sem.reglas_decision.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2.5 py-2 mb-1.5 border border-black/5 dark:border-white/5">
                    <span className="flex-shrink-0">⚡</span>
                    <span><strong>Si</strong> {r.condicion} → {r.accion}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Organic sync */}
            {sem.sync_organico && (
              <div className="mt-3 p-2.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed" style={{ background: 'rgba(240,165,0,.06)', border: '1px solid rgba(240,165,0,.25)' }}>
                <div className="text-[9px] font-bold uppercase tracking-[0.8px] mb-1" style={{ color: '#F0A500' }}>🔗 Sincronización con orgánico</div>
                {sem.sync_organico}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalendarioApp() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem('proy_theme') === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    setIsDark(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('proy_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // ── Form state ────────────────────────────────────────────
  const [cliente,        setCliente]        = useState('');
  const [industria,      setIndustria]      = useState('');
  const [mes,            setMes]            = useState('');
  const [kpi,            setKpi]            = useState('');
  const [kpi2,           setKpi2]           = useState('');
  const [posteos,        setPosteos]        = useState(8);
  const [presupuesto,    setPresupuesto]    = useState('');
  const [pixel,          setPixel]          = useState('Sí');
  const [audienciasCustom, setAudienciasCustom] = useState('Sí');
  const [segmento,       setSegmento]       = useState('');
  const [pain,           setPain]           = useState('');
  const [objecion,       setObjecion]       = useState('');
  const [motivacion,     setMotivacion]     = useState('');
  const [tonoChip,       setTonoChip]       = useState('Cercano / casual');
  const [tonoCustom,     setTonoCustom]     = useState('');
  const [plataformas,    setPlataformas]    = useState<string[]>([]);
  const [temporada,      setTemporada]      = useState('');
  const [historial,      setHistorial]      = useState('');
  const [restricciones,  setRestricciones]  = useState('');

  // ── UI state ──────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<'organico' | 'ads'>('organico');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [lastData,     setLastData]     = useState<{ calOrg: CalOrg; calAds: CalAds; d: BriefingData } | null>(null);
  const [badgeOrganico, setBadgeOrganico] = useState('—');

  // ── Derived ───────────────────────────────────────────────
  const getTono   = () => tonoCustom.trim() || tonoChip || 'Cercano / casual';
  const getPlats  = () => plataformas.length ? plataformas.join(', ') : 'Instagram, Facebook';

  const buildData = (): BriefingData => {
    const rule = KPI_RULES[kpi] || KPI_RULES.mensajes_ventas;
    const rule2 = kpi2 ? KPI_RULES[kpi2] || null : null;
    const factor = posteos / 12;
    const dist = {
      tofu:      Math.round(rule.dist.tofu * factor),
      mofu:      Math.round(rule.dist.mofu * factor),
      bofu:      Math.round(rule.dist.bofu * factor),
      retencion: Math.round(rule.dist.retencion * factor),
    };
    const suma = dist.tofu + dist.mofu + dist.bofu + dist.retencion;
    if (suma < posteos) dist.mofu += posteos - suma;
    if (suma > posteos) dist.mofu -= suma - posteos;
    const ind = industria || 'Otro';
    return {
      cliente, industria: ind, kpi, rule, kpi2, rule2, posteos, dist,
      funnel:       INDUSTRY_FUNNEL[ind] || INDUSTRY_FUNNEL['Otro'],
      plats:        getPlats(),
      diasOptimos:  DIAS_OPTIMOS[plataformas[0]] || ['Martes', 'Jueves', 'Sábado'],
      presupuesto:  parseInt(presupuesto) || 0,
      mes, segmento, pain, objecion, motivacion,
      tono:             getTono(),
      pixel,
      audiencias_custom: audienciasCustom,
      temporada, historial, restricciones,
    };
  };

  const buildPromptOrganico = (d: BriefingData): string => {
    const kpi2line   = d.rule2 ? `KPI secundario: ${d.rule2.label} (generar contenido que sirva a ambos)` : '';
    const descDist   = `TOFU ${d.dist.tofu}, MOFU ${d.dist.mofu}, BOFU ${d.dist.bofu}, RETENCION ${d.dist.retencion}`;
    const porSemana  = Math.ceil(d.posteos / 4);
    const activeFunnel = d.kpi === 'leads'
      ? [
          { semana: 'Semana 1', obj_meta: 'Tráfico',     fase: 'TOFU'  },
          { semana: 'Semana 2', obj_meta: 'Lead Ads',    fase: 'MOFU'  },
          { semana: 'Semana 3', obj_meta: 'Lead Ads',    fase: 'BOFU'  },
          { semana: 'Semana 4', obj_meta: 'Retargeting', fase: 'BOFU+' },
        ]
      : d.funnel;
    const syncLines = activeFunnel
      .map((f, i) => `- Semana ${i + 1} (ads: ${f.obj_meta} / ${f.fase}): el orgánico de esta semana debe REFORZAR ese objetivo, no contradecirlo`)
      .join('\n');

    return `Eres el estratega de contenido senior de Proyecta (agencia de marketing digital, México). Genera un calendario de contenido orgánico mensual 100% conectado al funnel de Meta Ads.

BRIEFING:
Cliente: ${d.cliente}
Industria: ${d.industria}
KPI principal: ${d.rule.label}
${kpi2line}
Mes: ${d.mes}
Plataformas: ${d.plats}
Días óptimos de publicación: ${d.diasOptimos.join(', ')}
Segmento ICA: ${d.segmento}
Pain point: ${d.pain || 'No especificado'}
Objeción #1 que impide la compra: ${d.objecion}
Motivador de compra: ${d.motivacion || 'No especificado'}
Tono de marca: ${d.tono}
Temporada: ${d.temporada || 'Sin fechas especiales'}
Historial exitoso: ${d.historial || 'Sin historial'}
Restricciones: ${d.restricciones || 'Ninguna'}

SINCRONIZACIÓN CON META ADS (CRÍTICO):
${syncLines}

REGLAS:
- Exactamente ${d.posteos} posts en 4 semanas (~${porSemana}/semana)
- Distribución: ${descDist} (total ${d.posteos})
- Publicar SOLO en días óptimos: ${d.diasOptimos.join(', ')}
- Tono SIEMPRE: ${d.tono} — aplica a TODO el copy
- Incluir OBLIGATORIAMENTE 1 post etiquetado como MOFU con objetivo "Anti-objeción: ${d.objecion}"
- copy_estructurado según formato:
  * Reel/Video: {"gancho":"3 seg","guion_escenas":["e1","e2","e3"],"cta_hablado":"texto"}
  * Carrusel: {"titulo_slide1":"texto","slides":[{"numero":1,"texto":"x"}],"cta_ultimo_slide":"texto"}
  * Post estático: {"texto_arte":"texto","caption":"texto","cta":"texto"}
  * Story: {"texto_superpuesto":"texto","accion_link":"texto"}
- Máximo 2 oraciones por campo. Concisos y directos.

RESPONDE SOLO JSON PURO. Sin texto ni markdown.

{"resumen":{"total_posts":${d.posteos},"tofu":${d.dist.tofu},"mofu":${d.dist.mofu},"bofu":${d.dist.bofu},"retencion":${d.dist.retencion},"narrativa":"2 oraciones","posts_clave":["t1","t2","t3"]},"semanas":[{"titulo":"Semana 1 — fechas","sync_ads":"objetivo del ad esta semana y cómo el orgánico lo refuerza","posts":[{"dia":"Martes 1","etapa":"TOFU","objetivo":"texto","formato":"Reel","tema":"título","copy_estructurado":{"gancho":"texto","guion_escenas":["e1","e2","e3"],"cta_hablado":"texto"},"cta":"texto","visual":"texto","justificacion":"texto","es_anti_objecion":false}]}],"alertas":[{"tipo":"fecha_clave","mensaje":"texto"}]}`;
  };

  const buildPromptAds = (d: BriefingData): string => {
    const kpi2line = d.rule2 ? `KPI secundario: ${d.rule2.label}` : '';
    const funnelFinal: FunnelWeek[] = d.kpi === 'leads'
      ? [
          { semana: 'Semana 1', obj_meta: 'Tráfico',                             fase: 'TOFU',  pct: 20, razon: 'Llevar tráfico frío a la landing page o formulario' },
          { semana: 'Semana 2', obj_meta: 'Generación de clientes potenciales',  fase: 'MOFU',  pct: 30, razon: 'Formulario nativo de Meta (Lead Ads) con oferta de valor' },
          { semana: 'Semana 3', obj_meta: 'Generación de clientes potenciales',  fase: 'BOFU',  pct: 30, razon: 'Lead Ads a audiencia cálida + lookalike de leads anteriores' },
          { semana: 'Semana 4', obj_meta: 'Retargeting',                         fase: 'BOFU+', pct: 20, razon: 'Retargeting visitantes sin convertir + secuencia de nurturing' },
        ]
      : d.funnel;
    const funnelDesc  = funnelFinal.map((f, i) => `Semana ${i + 1}: ${f.obj_meta} (${f.fase}) — ${f.razon} — ${f.pct}% del presupuesto`).join('\n');
    const presupMXN   = d.presupuesto || 15000;

    return `Eres el media buyer senior de Proyecta (agencia Meta Ads, México). Genera el plan estratégico completo de Meta Ads para el mes.

BRIEFING:
Cliente: ${d.cliente}
Industria: ${d.industria}
KPI principal: ${d.rule.label}
${kpi2line}
Mes: ${d.mes}
Presupuesto mensual total: $${presupMXN} MXN
Segmento ICA: ${d.segmento}
Pain point: ${d.pain || 'No especificado'}
Objeción #1: ${d.objecion}
Motivador de compra: ${d.motivacion || 'No especificado'}
Tono de marca: ${d.tono}
Pixel activo: ${d.pixel}
Audiencias personalizadas disponibles: ${d.audiencias_custom}
Temporada: ${d.temporada || 'Sin fechas especiales'}
Restricciones: ${d.restricciones || 'Ninguna'}

ARQUITECTURA DE FUNNEL PARA ESTA INDUSTRIA:
${funnelDesc}

REGLAS:
- 4 semanas, cada semana tiene 1 campaña principal
- Presupuesto distribuido según porcentajes de la arquitectura
- Por semana: 1-2 conjuntos de anuncios (audiencia fría + audiencia cálida si aplica)
- Por conjunto: copy variante A y variante B (testear variable distinta)
- Intereses con nombres EXACTOS de Meta Ads Manager en español
- Brief creativo con instrucciones concretas para diseñador
- Reglas de decisión al final de cada semana (si X → hacer Y)
- Máximo 2 oraciones por campo. Directo y accionable.

RESPONDE SOLO JSON PURO. Sin texto ni markdown.

{"plan_ads":{"presupuesto_total":${presupMXN},"mes":"${d.mes}","narrativa_estrategica":"2 oraciones sobre la estrategia"},"semanas":[{"semana":"Semana 1","objetivo_meta":"Alcance","fase_funnel":"TOFU","presupuesto_semana":3000,"presupuesto_diario":429,"justificacion":"texto","conjuntos":[{"nombre":"Audiencia Fría — Intereses","tipo_audiencia":"fria","audiencia":{"edad_min":25,"edad_max":45,"genero":"Todos","ubicaciones":["Ciudad, Estado"],"intereses_incluir":["interés exacto 1","interés exacto 2"],"intereses_excluir":["excluir 1"],"comportamientos":["comportamiento 1"],"audiencias_personalizadas":[]},"copy_a":{"headline":"máx 40 chars","texto_principal":"máx 2 oraciones","descripcion":"máx 1 oración","cta_boton":"Enviar mensaje","variable_test":"copy emocional vs racional"},"copy_b":{"headline":"variante B","texto_principal":"variante B","descripcion":"variante B","cta_boton":"Más información","variable_test":"mismo"},"brief_creativo":{"formato":"Reel 9:16","duracion":"15-30 seg","mensaje_principal":"texto","que_mostrar":"texto","que_NO_mostrar":"texto","texto_en_video":"texto","referencia_visual":"texto"}}],"reglas_decision":[{"condicion":"Si CPM > $80 MXN al día 3","accion":"Pausar conjunto y duplicar con audiencia más amplia"}],"sync_organico":"qué debe publicar orgánico esta semana para reforzar el ad"}]}`;
  };

  // ── Checklist data ────────────────────────────────────────
  const checks = [
    { label: 'Cliente',                    val: cliente    },
    { label: 'Industria',                  val: industria  },
    { label: 'KPI principal',              val: kpi        },
    { label: 'Mes',                        val: mes        },
    { label: 'Presupuesto Meta Ads',       val: presupuesto },
    { label: 'Segmento / ICA',             val: segmento   },
    { label: 'Objeción principal del ICA', val: objecion   },
  ];
  const allOk = checks.every(c => !!c.val.trim());

  // ── Generate ──────────────────────────────────────────────
  const confirmarGenerar = async () => {
    setModalOpen(false);
    setLoading(true);
    setError('');
    const d = buildData();
    try {
      const [resOrg, resAds] = await Promise.allSettled([
        callWithRetry(buildPromptOrganico(d), 'Calendario orgánico'),
        callWithRetry(buildPromptAds(d), 'Plan de Ads'),
      ]);
      if (resOrg.status === 'rejected') throw new Error('Calendario orgánico: ' + resOrg.reason?.message);
      if (resAds.status === 'rejected') throw new Error('Plan de Ads: ' + resAds.reason?.message);
      const calOrg = resOrg.value as CalOrg;
      const calAds = resAds.value as CalAds;
      setLastData({ calOrg, calAds, d });
      setBadgeOrganico((calOrg?.resumen?.total_posts || '?') + ' posts');
      setActiveTab('organico');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared class helpers ──────────────────────────────────
  const inputCls = 'w-full px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/[.12] transition-colors';
  const secTitle = 'text-[10px] font-bold tracking-[1.4px] uppercase text-zinc-400 dark:text-zinc-500 mb-3 pb-1.5 border-b border-black/6 dark:border-white/6';
  const labelCls = 'text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 block';

  const Chip = ({ val, active, onClick }: { val: string; active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer select-none ${
        active
          ? 'bg-accent border-accent text-white'
          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-accent hover:text-accent'
      }`}
    >
      {val}
    </button>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">

      {/* ── Header ── */}
      <header className="h-13 bg-white/95 dark:bg-zinc-900/97 border-b border-black/6 dark:border-white/6 flex items-center justify-between px-5 flex-shrink-0 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            ← Dashboard
          </Link>
          <span className="text-zinc-200 dark:text-zinc-700">/</span>
          <span className="font-[family-name:var(--font-cond)] font-bold text-sm text-zinc-800 dark:text-zinc-200">Calendario Estratégico</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border" style={{ background: 'rgba(232,52,42,.10)', color: '#E8342A', borderColor: 'rgba(232,52,42,.2)' }}>v5.0</span>
          <button
            onClick={toggleTheme}
            className="w-7 h-7 rounded-lg border border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-800 text-sm flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Briefing form ── */}
        <aside className="w-[360px] flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-black/6 dark:border-white/6 overflow-y-auto p-4 space-y-4">

          {/* Cliente */}
          <div>
            <p className={secTitle}>📋 Cliente</p>
            <div className="space-y-2.5">
              <div>
                <label className={labelCls}>Cliente <span className="text-accent">*</span></label>
                <input className={inputCls} value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Ej: Gran Acuario Mazatlán" />
              </div>
              <div>
                <label className={labelCls}>Industria <span className="text-accent">*</span></label>
                <select className={inputCls} value={industria} onChange={e => setIndustria(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {['Turismo / Atracción', 'Hotel / Hospedaje', 'Food & Lifestyle', 'Healthcare / Salud', 'Ecommerce', 'B2B / Servicios', 'Retail / Comercio', 'Otro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Mes a planear <span className="text-accent">*</span></label>
                <select className={inputCls} value={mes} onChange={e => setMes(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {['Enero 2026', 'Febrero 2026', 'Marzo 2026', 'Abril 2026', 'Mayo 2026', 'Junio 2026', 'Julio 2026', 'Agosto 2026', 'Septiembre 2026', 'Octubre 2026', 'Noviembre 2026', 'Diciembre 2026'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* KPI */}
          <div>
            <p className={secTitle}>🎯 KPI & Objetivos</p>
            <div className="space-y-2.5">
              <div>
                <label className={labelCls}>KPI principal <span className="text-accent">*</span></label>
                <select className={inputCls} value={kpi} onChange={e => setKpi(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  <option value="mensajes_ventas">💬 Mensajes / Ventas directas</option>
                  <option value="reservaciones">📅 Reservaciones / Citas</option>
                  <option value="trafico_web">🌐 Tráfico a sitio web</option>
                  <option value="awareness">📣 Awareness / Seguidores</option>
                  <option value="retencion">🔁 Retención / Recompra</option>
                  <option value="leads">📋 Leads / Formularios</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>KPI secundario <span className="text-zinc-400 font-normal">(opcional)</span></label>
                <select className={inputCls} value={kpi2} onChange={e => setKpi2(e.target.value)}>
                  <option value="">Ninguno</option>
                  <option value="mensajes_ventas">💬 Mensajes / Ventas directas</option>
                  <option value="reservaciones">📅 Reservaciones / Citas</option>
                  <option value="trafico_web">🌐 Tráfico a sitio web</option>
                  <option value="awareness">📣 Awareness / Seguidores</option>
                  <option value="retencion">🔁 Retención / Recompra</option>
                  <option value="leads">📋 Leads / Formularios</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">Ej: Hotel → KPI1 Reservaciones + KPI2 Mensajes</p>
              </div>
              <div>
                <label className={labelCls}>Posteos orgánicos por mes</label>
                <div className="flex gap-1.5">
                  {[4, 8, 12].map(v => <Chip key={v} val={String(v)} active={posteos === v} onClick={() => setPosteos(v)} />)}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">4=1/sem · 8=2/sem · 12=3/sem</p>
              </div>
            </div>
          </div>

          {/* Presupuesto */}
          <div>
            <p className={secTitle}>💰 Presupuesto & Ads</p>
            <div className="space-y-2.5">
              <div>
                <label className={labelCls}>Presupuesto Meta Ads mensual <span className="text-accent">*</span></label>
                <input className={inputCls} value={presupuesto} onChange={e => setPresupuesto(e.target.value)} placeholder="Ej: 15000" />
                <p className="text-[10px] text-zinc-400 mt-1">Solo número en MXN. El sistema distribuye por semana.</p>
              </div>
              <div>
                <label className={labelCls}>¿Tiene Pixel activo?</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Sí', 'No', 'En proceso'].map(v => <Chip key={v} val={v} active={pixel === v} onClick={() => setPixel(v)} />)}
                </div>
              </div>
              <div>
                <label className={labelCls}>¿Tiene audiencias personalizadas?</label>
                <div className="flex gap-1.5">
                  {['Sí', 'No'].map(v => <Chip key={v} val={v} active={audienciasCustom === v} onClick={() => setAudienciasCustom(v)} />)}
                </div>
              </div>
            </div>
          </div>

          {/* ICA */}
          <div>
            <p className={secTitle}>👤 Perfil de Cliente Ideal</p>
            <div className="space-y-2.5">
              <div>
                <label className={labelCls}>Segmento principal <span className="text-accent">*</span></label>
                <input className={inputCls} value={segmento} onChange={e => setSegmento(e.target.value)} placeholder="Ej: Familias 28-45 años, Mazatlán" />
              </div>
              <div>
                <label className={labelCls}>Pain point principal</label>
                <input className={inputCls} value={pain} onChange={e => setPain(e.target.value)} placeholder="Ej: No saben qué hacer en vacaciones" />
              </div>
              <div>
                <label className={labelCls}>Objeción #1 que impide la compra <span className="text-accent">*</span></label>
                <input className={inputCls} value={objecion} onChange={e => setObjecion(e.target.value)} placeholder="Ej: Precio, desconfianza, no sabe que existe" />
                <p className="text-[10px] text-zinc-400 mt-1">Se generará un post que destruya esta objeción.</p>
              </div>
              <div>
                <label className={labelCls}>Qué lo mueve a comprar</label>
                <input className={inputCls} value={motivacion} onChange={e => setMotivacion(e.target.value)} placeholder="Ej: Urgencia, precio, recomendaciones" />
              </div>
            </div>
          </div>

          {/* Tono */}
          <div>
            <p className={secTitle}>🎭 Tono de Marca</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { v: 'Cercano / casual',            label: '😊 Cercano'       },
                { v: 'Inspirador / aspiracional',   label: '✨ Inspirador'    },
                { v: 'Profesional / formal',        label: '💼 Profesional'   },
                { v: 'Urgente / directo',           label: '⚡ Urgente'       },
                { v: 'Educativo / experto',         label: '📚 Educativo'     },
                { v: 'Divertido / irreverente',     label: '🎉 Divertido'     },
                { v: 'Lujoso / exclusivo',          label: '💎 Lujoso'        },
                { v: 'Empático / humano',           label: '🤝 Empático'      },
                { v: 'Minimalista / limpio',        label: '◻ Minimalista'    },
                { v: 'Narrativo / storytelling',    label: '📖 Storytelling'  },
              ].map(t => <Chip key={t.v} val={t.label} active={tonoChip === t.v} onClick={() => setTonoChip(t.v)} />)}
            </div>
            <p className="text-[10px] text-zinc-400 mb-1">O describe el tono específico:</p>
            <input className={inputCls} value={tonoCustom} onChange={e => setTonoCustom(e.target.value)} placeholder="Ej: Como un amigo experto en salud" />
          </div>

          {/* Plataformas */}
          <div>
            <p className={secTitle}>📱 Plataformas</p>
            <div className="flex flex-wrap gap-1.5">
              {['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube Shorts'].map(p => (
                <Chip
                  key={p} val={p} active={plataformas.includes(p)}
                  onClick={() => setPlataformas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                />
              ))}
            </div>
          </div>

          {/* Contexto */}
          <div>
            <p className={secTitle}>📆 Contexto</p>
            <div className="space-y-2.5">
              <div>
                <label className={labelCls}>Temporada / fechas especiales</label>
                <input className={inputCls} value={temporada} onChange={e => setTemporada(e.target.value)} placeholder="Ej: Semana Santa, Día de las Madres" />
              </div>
              <div>
                <label className={labelCls}>Historial de contenido exitoso</label>
                <textarea className={`${inputCls} resize-y min-h-[58px]`} value={historial} onChange={e => setHistorial(e.target.value)} placeholder="Ej: Reels de experiencias, testimonios..." />
              </div>
              <div>
                <label className={labelCls}>Restricciones</label>
                <textarea className={`${inputCls} resize-y min-h-[58px]`} value={restricciones} onChange={e => setRestricciones(e.target.value)} placeholder="Ej: No mostrar precios, CTA a WhatsApp..." />
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={() => setModalOpen(true)}
            disabled={loading}
            className="w-full py-3 rounded-xl font-[family-name:var(--font-cond)] font-bold text-sm text-white flex items-center justify-center gap-2 grad-accent shadow-[0_4px_16px_rgba(232,52,42,.3)] hover:opacity-90 disabled:opacity-55 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? '⟳ Generando...' : '✦ Generar Plan Completo'}
          </button>
        </aside>

        {/* ── RIGHT: Output ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Tabs bar */}
          <div className="bg-white dark:bg-zinc-900 border-b border-black/6 dark:border-white/6 px-6 flex items-center flex-shrink-0">
            {(['organico', 'ads'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'text-accent border-accent font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab === 'organico' ? '📅 Calendario Orgánico' : '📣 Plan de Meta Ads'}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-accent/[.12] text-accent' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {tab === 'organico' ? badgeOrganico : (lastData ? '4 semanas' : '—')}
                </span>
              </button>
            ))}

            {lastData && (
              <div className="ml-auto py-2">
                <button
                  onClick={() => {
                    const { calOrg, d } = lastData;
                    let txt = `CALENDARIO — ${d.cliente} — ${d.mes}\nKPI: ${d.rule.label}\n`;
                    (calOrg.semanas || []).forEach(s => {
                      txt += `\n${s.titulo}\n${'─'.repeat(40)}\n`;
                      (s.posts || []).forEach(p => { txt += `\n📅 ${p.dia} | ${p.formato} | ${p.etapa}\nTema: ${p.tema}\nCTA: ${p.cta}\n`; });
                    });
                    navigator.clipboard.writeText(txt).catch(() => {});
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-black/8 dark:border-white/8 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  📋 Copiar
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-accent animate-spin-slow" />
                <div className="font-[family-name:var(--font-cond)] text-lg font-bold text-zinc-800 dark:text-zinc-200">Construyendo plan completo...</div>
                <div className="flex flex-col gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>✦ Analizando industria y KPI</span>
                  <span>✦ Estructurando funnel de ads por semana</span>
                  <span>✦ Generando copies A/B y briefs creativos</span>
                  <span>✦ Sincronizando orgánico con campañas</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl shadow border border-black/6 dark:border-white/6">⚠️</div>
                <div className="font-[family-name:var(--font-cond)] text-xl font-bold text-zinc-800 dark:text-zinc-200">Error al generar</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">{error}</div>
                <button onClick={() => setModalOpen(true)} className="mt-2 px-5 py-2 rounded-xl grad-accent text-white font-[family-name:var(--font-cond)] font-bold text-sm hover:opacity-90 transition-opacity">
                  ↺ Reintentar
                </button>
              </div>
            ) : !lastData ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-3xl shadow border border-black/6 dark:border-white/6">
                  {activeTab === 'organico' ? '📅' : '📣'}
                </div>
                <div className="font-[family-name:var(--font-cond)] text-xl font-bold text-zinc-800 dark:text-zinc-200">
                  {activeTab === 'organico' ? 'Calendario Orgánico' : 'Plan de Meta Ads'}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                  {activeTab === 'organico'
                    ? 'Completa el briefing y genera el plan completo. El contenido orgánico estará sincronizado semana a semana con tus campañas de Meta Ads.'
                    : 'El plan incluye arquitectura por semana, conjuntos de anuncios, copy A/B, brief para diseñador y reglas de decisión de optimización.'}
                </div>
              </div>
            ) : activeTab === 'organico' ? (
              <OrganicoPanel calOrg={lastData.calOrg} d={lastData.d} />
            ) : (
              <AdsPanel calAds={lastData.calAds} d={lastData.d} />
            )}
          </div>
        </div>
      </div>

      {/* ── Checklist Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-[90%] shadow-[0_20px_60px_rgba(0,0,0,.25)] fade-in">
            <div className="font-[family-name:var(--font-cond)] text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              ✅ Confirmar generación
            </div>
            <div className="flex flex-col gap-2 mb-5">
              {checks.map(c => {
                const ok = !!c.val.trim();
                return (
                  <div key={c.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${ok ? 'bg-pgreen/[.07] border border-pgreen/[.25]' : 'bg-accent/[.07] border border-accent/[.25]'}`}>
                    <span>{ok ? '✅' : '❌'}</span>
                    <span className="text-zinc-800 dark:text-zinc-200">{c.label}{!ok && <strong> — requerido</strong>}</span>
                  </div>
                );
              })}
              {kpi && kpi2 && kpi === kpi2 && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs bg-pamber/[.07] border border-pamber/[.25]">
                  <span>⚠️</span>
                  <span className="text-zinc-800 dark:text-zinc-200">KPI1 y KPI2 son iguales — el secundario no aportará valor</span>
                </div>
              )}
              {plataformas.length === 0 && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs bg-pamber/[.07] border border-pamber/[.25]">
                  <span>⚠️</span>
                  <span className="text-zinc-800 dark:text-zinc-200">Sin plataformas — se usará Instagram y Facebook por defecto</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs bg-pgreen/[.07] border border-pgreen/[.25]">
                <span>📋</span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Se generarán <strong>{posteos} posts orgánicos</strong> + plan de <strong>4 semanas de Meta Ads</strong>
                  {presupuesto ? ` con $${presupuesto} MXN` : ''}
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarGenerar}
                disabled={!allOk}
                className="px-5 py-2 rounded-lg grad-accent text-white font-[family-name:var(--font-cond)] font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Generar ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
