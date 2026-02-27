'use client';
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement, BarElement, PointElement, LineElement,
  CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, BarController, ScatterController, LineController,
  type ChartConfiguration,
} from 'chart.js';
import { DashboardData } from '../lib/types';

ChartJS.register(
  ArcElement, BarElement, PointElement, LineElement,
  CategoryScale, LinearScale, Tooltip, Legend,
  DoughnutController, BarController, ScatterController, LineController,
);

const COLORS = ['#e73642','#10c98f','#f59e0b','#6366f1','#ec4899','#06b6d4'];

interface Props { data: DashboardData; isDark: boolean; }

export default function ChartsSection({ data, isDark }: Props) {
  const campaigns = data.campaigns;
  const labels    = campaigns.map(c => c.name.length > 16 ? c.name.substring(0, 15) + '…' : c.name);

  const gridColor = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)';
  const tickColor = isDark ? '#55556a' : '#8888a8';
  const textColor = isDark ? '#9999b8' : '#4a4a62';

  const baseScales = {
    x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Roboto Mono', size: 10 } } },
    y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Roboto Mono', size: 10 } } },
  };

  return (
    <section id="charts" className="mb-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="font-[family-name:var(--font-roboto-mono)] text-xs font-medium text-accent bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-md tracking-wider">02</span>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Rendimiento Visual</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <ChartCard title="Distribución de Gasto" sub="% presupuesto por campaña">
          <DonutChart labels={labels} data={campaigns.map(c => c.spend)} colors={COLORS} textColor={textColor} isDark={isDark} />
        </ChartCard>
        <ChartCard title="CPL-I por Campaña" sub="Costo clic intención · benchmark rojo">
          <HBarChart labels={labels} data={campaigns.map(c => c.cpli ?? 0)} baseScales={baseScales} textColor={textColor} />
        </ChartCard>
        <div className="md:col-span-2">
          <ChartCard title="CTR vs Frecuencia" sub="Zona ideal: CTR alto + frecuencia baja · verde = escalar · rojo = pausar">
            <ScatterChart campaigns={campaigns} baseScales={baseScales} />
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-black/6 dark:border-white/6 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/6 dark:border-white/6">
        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 tracking-tight">{title}</div>
        <div className="text-xs font-light text-zinc-400 mt-0.5">{sub}</div>
      </div>
      <div className="p-4 h-52">{children}</div>
    </div>
  );
}

function DonutChart({ labels, data, colors, textColor, isDark }: {
  labels: string[]; data: number[]; colors: string[]; textColor: string; isDark: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.map(c => c + 'bb'), borderColor: isDark ? '#1a1b25' : '#ffffff', borderWidth: 3 }],
      },
      options: {
        plugins: { legend: { position: 'right', labels: { color: textColor, font: { family: 'Roboto Mono', size: 10 }, boxWidth: 10, padding: 10 } } },
        cutout: '62%', maintainAspectRatio: false, responsive: true,
      },
    };
    chartRef.current = new ChartJS(ref.current, config);
    return () => { chartRef.current?.destroy(); };
  }, [labels, data, colors, textColor, isDark]);

  return <canvas ref={ref} />;
}

function HBarChart({ labels, data, baseScales, textColor }: {
  labels: string[]; data: number[]; baseScales: object; textColor: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'CPL-I',
            data,
            backgroundColor: data.map(v => v > 8 ? 'rgba(231,54,66,.75)' : v > 5 ? 'rgba(245,158,11,.75)' : 'rgba(16,201,143,.7)'),
            borderColor:      data.map(v => v > 8 ? 'rgba(231,54,66,1)'   : v > 5 ? 'rgba(245,158,11,1)'   : 'rgba(16,201,143,1)'),
            borderWidth: 1, borderRadius: 5,
          },
          {
            label: 'Benchmark',
            data: data.map(() => 5),
            type: 'line' as const,
            borderColor: 'rgba(231,54,66,.5)',
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
          } as never,
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false, responsive: true,
        plugins: { legend: { labels: { color: textColor, font: { family: 'Roboto Mono', size: 10 } } } },
        scales: { x: { ...(baseScales as { x: object; y: object }).x, beginAtZero: true }, y: (baseScales as { x: object; y: object }).y },
      },
    };
    chartRef.current = new ChartJS(ref.current, config);
    return () => { chartRef.current?.destroy(); };
  }, [labels, data, baseScales, textColor]);

  return <canvas ref={ref} />;
}

function ScatterChart({ campaigns, baseScales }: { campaigns: DashboardData['campaigns']; baseScales: object }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();
    const scalesCasted = baseScales as { x: object; y: object };
    const tickColor = (scalesCasted.x as { ticks: { color: string } }).ticks.color;
    const config: ChartConfiguration<'scatter'> = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Campañas',
          data: campaigns.map(c => ({ x: c.freq ?? 0, y: c.ctr ?? 0, ...{ label: c.name } })),
          backgroundColor: campaigns.map(c =>
            (c.ctr ?? 0) > 2 && (c.freq ?? 0) < 2.5 ? 'rgba(16,201,143,.8)' :
            (c.ctr ?? 0) < 1.5 || (c.freq ?? 0) > 3.5 ? 'rgba(231,54,66,.8)' :
            'rgba(245,158,11,.8)'
          ),
          pointRadius: 8, pointHoverRadius: 11,
        }],
      },
      options: {
        maintainAspectRatio: false, responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${(ctx.raw as { label: string }).label} CTR: ${(ctx.raw as { y: number }).y}% Frec: ${(ctx.raw as { x: number }).x}x` } },
        },
        scales: {
          x: { ...scalesCasted.x, title: { display: true, text: 'Frecuencia', color: tickColor, font: { size: 10, family: 'Roboto Mono' } } },
          y: { ...scalesCasted.y, title: { display: true, text: 'CTR %',       color: tickColor, font: { size: 10, family: 'Roboto Mono' } } },
        },
      },
    };
    chartRef.current = new ChartJS(ref.current, config);
    return () => { chartRef.current?.destroy(); };
  }, [campaigns, baseScales]);

  return <canvas ref={ref} />;
}
