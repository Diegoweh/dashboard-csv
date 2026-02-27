'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardData, View, Theme } from '../lib/types';
import { DEMO_DATA, CLAUDE_MODEL } from '../lib/data';
import { fmt$, fmtPct, fmtK } from '../lib/utils';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import UploadView from './UploadView';
import DashboardContent from './DashboardContent';
import WinnerModal from './WinnerModal';
import ApiKeyModal from './ApiKeyModal';
import Footer from './Footer';

function getAlertCount(data: DashboardData): number {
  const m = data.metrics, bench = 5;
  let count = 0;
  data.campaigns.forEach(c => { if (c.cpli && c.cpli > bench * 2) count++; });
  if (m.lpv_rate && m.lpv_rate < 85) count++;
  return count;
}

export default function DashboardApp() {
  const [view,           setView]          = useState<View>('dashboard');
  const [data,           setData]          = useState<DashboardData>(DEMO_DATA);
  const [theme,          setTheme]         = useState<Theme>('light');
  const [apiKey,         setApiKey]        = useState('');
  const [showApiKey,     setShowApiKey]    = useState(false);
  const [winnerModal,    setWinnerModal]   = useState({ open: false, idx: 0 });
  const [dateStr,        setDateStr]       = useState('');
  const [pdfLoading,     setPdfLoading]    = useState<'visual' | 'audit' | null>(null);

  const aiBodyRef = useRef<HTMLDivElement>(null);
  const dashContentRef = useRef<HTMLDivElement>(null);

  // Init: load theme + apiKey from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('proy_theme') as Theme) || 'light';
    const savedKey   = localStorage.getItem('proy_apikey') || '';
    setTheme(savedTheme);
    setApiKey(savedKey);
    const d = new Date();
    setDateStr(d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }));
  }, []);

  // Apply dark class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('proy_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('proy_apikey', key);
  };

  const switchView = (v: View) => setView(v);

  const scrollToSection = (id: string) => {
    setView('dashboard');
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 66;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }, 80);
  };

  const runAIAnalysis = () => {
    setView('dashboard');
    setTimeout(() => {
      scrollToSection('aiinsights');
      // Trigger the AI button programmatically isn't straightforward;
      // instead we scroll to the section and the user sees the "Generar análisis" button
    }, 200);
  };

  // Dashboard PDF
  const downloadDashboardPDF = useCallback(async () => {
    if (pdfLoading) return;
    setPdfLoading('visual');
    try {
      const [jsPDFMod, html2canvas] = await Promise.all([
        import('jspdf'),
        import('html2canvas').then(m => m.default),
      ]);
      const jsPDF = jsPDFMod.default;
      const content = document.getElementById('dashboardContent');
      if (!content) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F5F5F7',
        windowWidth: 1200,
        onclone: (clonedDoc: Document) => {
          // html2canvas doesn't support lab()/oklch() used by Tailwind v4 — strip those rules
          Array.from(clonedDoc.styleSheets).forEach(sheet => {
            try {
              const rules = Array.from(sheet.cssRules || []);
              for (let i = rules.length - 1; i >= 0; i--) {
                const text = (rules[i] as CSSStyleRule).cssText || '';
                if (text.includes('lab(') || text.includes('oklch(')) {
                  sheet.deleteRule(i);
                }
              }
            } catch { /* skip cross-origin sheets */ }
          });
        },
      } as any);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10, usableW = pageW - margin * 2;
      const imgH = (canvas.height * usableW) / canvas.width;
      const accent: [number, number, number] = [232, 52, 42];
      pdf.setFillColor(...accent); pdf.rect(0, 0, pageW, 12, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
      pdf.text('PROYECTA · META ADS INTELLIGENCE', margin, 8);
      pdf.text(data.period, pageW - margin, 8, { align: 'right' });
      let yOffset = 14, remaining = imgH, srcY = 0;
      const availH = pageH - yOffset - 14;
      while (remaining > 0) {
        const sliceH = Math.min(remaining, availH);
        const sc = document.createElement('canvas');
        sc.width = canvas.width; sc.height = (sliceH / imgH) * canvas.height;
        sc.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, sc.height, 0, 0, canvas.width, sc.height);
        pdf.addImage(sc.toDataURL('image/png'), 'PNG', margin, yOffset, usableW, sliceH);
        remaining -= sliceH; srcY += sc.height;
        if (remaining > 0) { pdf.addPage(); yOffset = 10; }
      }
      pdf.setFillColor(...accent); pdf.rect(0, pageH - 8, pageW, 8, 'F');
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(7);
      pdf.text(`Generado por Proyecta · ${new Date().toLocaleDateString('es-MX')}`, margin, pageH - 3);
      pdf.save(`dashboard-${data.clientName.replace(/\s/g,'-')}-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) { console.error(e); alert('Error al generar el PDF. Intenta de nuevo.'); }
    finally { setPdfLoading(null); }
  }, [data, theme, pdfLoading]);

  // Audit PDF (AI-generated)
  const downloadAuditPDF = useCallback(async () => {
    if (!apiKey) { setShowApiKey(true); return; }
    if (pdfLoading) return;
    setPdfLoading('audit');
    try {
      // Get AI analysis
      const campaigns = data.campaigns, metrics = data.metrics;
      const csvResumen = campaigns.map(c =>
        `${c.name} | Spend: $${c.spend} | CTR: ${c.ctr}% | CPC: $${c.cpc} | CPM: ${c.cpm||'N/A'} | Frec: ${c.freq} | Acción: ${c.action||'N/A'}`
      ).join('\n');
      const masterPrompt = `Eres un Senior Meta Ads Auditor con 10+ años de experiencia. Tu análisis debe ser técnico, ejecutivo y 100% accionable. Sin relleno. Sin frases genéricas. Habla en español.

DATOS DE LA CUENTA:
Cliente: ${data.clientName}
Total campañas: ${campaigns.length}
Presupuesto total del período: $${metrics.spend}
CTR promedio cuenta: ${metrics.ctr||'N/A'}%
CPC promedio: $${metrics.cpc||'N/A'}
CPM promedio: $${metrics.cpm||'N/A'}
Frecuencia promedio: ${metrics.freq||'N/A'}
Impresiones: ${metrics.impressions||'N/A'}
Clicks: ${metrics.link_clicks||'N/A'}

DETALLE DE CAMPAÑAS:
${csvResumen}

GENERA UN REPORTE CON EXACTAMENTE ESTA ESTRUCTURA:

## EXECUTIVE SUMMARY
5 puntos críticos con el dato numérico que los sustenta.

## DIAGNÓSTICO DE SALUD (escala 1-10 con justificación breve)
- Eficiencia de presupuesto: X/10
- Calidad estructural: X/10
- Saturación de audiencias: X/10
- Rendimiento de creativos: X/10
- Puntuación global: X/10

## DESPERDICIOS IDENTIFICADOS
Lista: Campaña | Problema | Acción recomendada

## ANÁLISIS TÉCNICO
Estructura, rendimiento, señales de alerta. Específico con los nombres de campañas reales.

## PLAN DE ACCIÓN PRIORIZADO
🔴 URGENTE (esta semana): máx 3 acciones → impacto esperado
🟡 PRIORITARIO (próximas 2 semanas): máx 4 acciones
🟢 OPTIMIZACIÓN (próximo mes): máx 4 acciones

## PROYECCIÓN DE MEJORA
- Ahorro mensual estimado si se ejecutan acciones urgentes
- Mejora de CTR proyectada
- Reducción de CPC proyectada
- Observación final: una línea con el hallazgo más importante.`;

      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model: CLAUDE_MODEL, max_tokens: 2000, messages: [{ role: 'user', content: masterPrompt }] }),
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const result = await resp.json();
      const analisis: string = result.content?.[0]?.text || 'Sin respuesta de la IA.';

      // Build PDF
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
      const margin = 16, usableW = pageW - margin * 2;
      const accent: [number,number,number] = [232,52,42], dark: [number,number,number] = [26,26,26], gray: [number,number,number] = [100,100,100];
      const fecha = new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' });
      pdf.setFillColor(...accent); pdf.rect(0, 0, pageW, 28, 'F');
      pdf.setTextColor(255,255,255); pdf.setFontSize(20); pdf.setFont('helvetica','bold');
      pdf.text('AUDITORÍA META ADS', margin, 14);
      pdf.setFontSize(9); pdf.setFont('helvetica','normal');
      pdf.text(`${data.clientName}  ·  ${fecha}`, margin, 21);
      pdf.text('Proyecta · proyecta.mx', pageW - margin, 21, { align:'right' });
      pdf.setDrawColor(...accent); pdf.setLineWidth(0.5); pdf.line(margin, 32, pageW-margin, 32);
      let y = 40; const lineH = 6, maxY = pageH - 18;
      const addFooter = () => {
        pdf.setFillColor(245,245,245); pdf.rect(0, pageH-10, pageW, 10, 'F');
        pdf.setTextColor(...gray); pdf.setFontSize(7); pdf.setFont('helvetica','normal');
        pdf.text(`Generado con IA por Proyecta · ${fecha}`, margin, pageH-4);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdf.text(`Pág. ${(pdf.internal as any).getCurrentPageInfo().pageNumber}`, pageW-margin, pageH-4, { align:'right' });
      };
      const checkPage = () => {
        if (y > maxY) {
          addFooter(); pdf.addPage();
          pdf.setFillColor(...accent); pdf.rect(0,0,pageW,10,'F');
          pdf.setTextColor(255,255,255); pdf.setFontSize(7); pdf.setFont('helvetica','bold');
          pdf.text('AUDITORÍA META ADS · PROYECTA', margin, 7); y = 16;
        }
      };
      for (const rawLine of analisis.split('\n')) {
        const line = rawLine.trim(); if (!line) { y += 3; continue; }
        checkPage();
        if (line.startsWith('## ')) {
          y += 4; checkPage();
          pdf.setFillColor(...accent); pdf.rect(margin, y-4, usableW, 8, 'F');
          pdf.setTextColor(255,255,255); pdf.setFontSize(10); pdf.setFont('helvetica','bold');
          pdf.text(line.replace('## ','').toUpperCase(), margin+3, y+0.5); y += 8; continue;
        }
        if (line.startsWith('🔴')) { pdf.setFillColor(255,235,238); pdf.rect(margin,y-3.5,usableW,7,'F'); pdf.setTextColor(...accent); pdf.setFontSize(9); pdf.setFont('helvetica','bold'); pdf.text('● URGENTE — '+line.replace('🔴','').trim(), margin+2, y+0.5); y += lineH+1; continue; }
        if (line.startsWith('🟡')) { pdf.setFillColor(255,248,225); pdf.rect(margin,y-3.5,usableW,7,'F'); pdf.setTextColor(180,120,0); pdf.setFontSize(9); pdf.setFont('helvetica','bold'); pdf.text('● PRIORITARIO — '+line.replace('🟡','').trim(), margin+2, y+0.5); y += lineH+1; continue; }
        if (line.startsWith('🟢')) { pdf.setFillColor(232,245,233); pdf.rect(margin,y-3.5,usableW,7,'F'); pdf.setTextColor(46,125,50); pdf.setFontSize(9); pdf.setFont('helvetica','bold'); pdf.text('● OPTIMIZACIÓN — '+line.replace('🟢','').trim(), margin+2, y+0.5); y += lineH+1; continue; }
        if (line.startsWith('### ') || (line.startsWith('**') && line.endsWith('**'))) {
          pdf.setTextColor(...dark); pdf.setFontSize(9); pdf.setFont('helvetica','bold');
          pdf.splitTextToSize(line.replace(/^###\s*/,'').replace(/\*\*/g,''), usableW).forEach((l: string) => { checkPage(); pdf.text(l, margin, y); y += lineH; }); continue;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          pdf.setTextColor(...dark); pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
          pdf.splitTextToSize('·  '+line.replace(/^[-•]\s*/,'').replace(/\*\*/g,''), usableW-4).forEach((l: string, i: number) => { checkPage(); pdf.text(l, margin+(i>0?5:0), y); y += lineH-0.5; }); continue;
        }
        pdf.setTextColor(...dark); pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
        pdf.splitTextToSize(line.replace(/\*\*/g,''), usableW).forEach((l: string) => { checkPage(); pdf.text(l, margin, y); y += lineH; });
      }
      addFooter();
      pdf.save(`auditoria-${data.clientName.replace(/\s/g,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) { console.error(e); alert('Error al generar la auditoría. Verifica que la API key esté configurada.'); }
    finally { setPdfLoading(null); }
  }, [data, apiKey, pdfLoading]);

  const alertCount = getAlertCount(data);
  const isLive = !!(data.clientName && data.clientName !== 'DEMO');

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-zinc-100'} transition-colors`}>
      {/* Sidebar */}
      <Sidebar
        currentView={view}
        data={data}
        onSwitchView={switchView}
        onScrollTo={scrollToSection}
        alertCount={alertCount}
      />

      {/* Main */}
      <div className="ml-58 flex-1 flex flex-col min-w-0">
        <TopBar
          period={data.period}
          dateStr={dateStr}
          isLive={isLive}
          hasApiKey={!!apiKey}
          isDark={theme === 'dark'}
          onSwitchView={switchView}
          onToggleTheme={toggleTheme}
          onRunAI={runAIAnalysis}
          onDashboardPDF={downloadDashboardPDF}
          onAuditPDF={downloadAuditPDF}
          onOpenApiKey={() => setShowApiKey(true)}
        />

        <main className="flex-1 px-7 pt-7 pb-0">
          {view === 'upload' ? (
            <UploadView
              onApply={d => { setData(d); switchView('dashboard'); }}
              onResetDemo={() => { setData(DEMO_DATA); switchView('dashboard'); }}
            />
          ) : (
            <div ref={dashContentRef}>
              <DashboardContent
                data={data}
                apiKey={apiKey}
                isDark={theme === 'dark'}
                onOpenModal={idx => setWinnerModal({ open: true, idx })}
                aiBodyRef={aiBodyRef}
              />
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Modals */}
      {winnerModal.open && (
        <WinnerModal
          open={winnerModal.open}
          campaignIndex={winnerModal.idx}
          data={data}
          apiKey={apiKey}
          onClose={() => setWinnerModal(m => ({ ...m, open: false }))}
        />
      )}
      {showApiKey && (
        <ApiKeyModal
          apiKey={apiKey}
          onSave={saveApiKey}
          onClose={() => setShowApiKey(false)}
        />
      )}

      {/* PDF loading overlay */}
      {pdfLoading && (
        <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-600 border-t-accent animate-spin-slow" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {pdfLoading === 'audit' ? 'Analizando con Claude AI…' : 'Generando PDF…'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
