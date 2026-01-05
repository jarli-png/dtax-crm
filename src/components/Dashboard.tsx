'use client';
import { useState, useEffect } from 'react';
import { CalendarIcon, UserGroupIcon, CurrencyDollarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface FunnelStage {
  name: string;
  status: string[];
  count: number;
  value: number;
  probability: number;
  color: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  prospect: { id: string; firstName: string; lastName: string };
}

interface Stats {
  totalProspects: number;
  newThisWeek: number;
  inProgress: number;
  converted: number;
  totalValue: number;
  totalShareCapital: number;
}

export default function Dashboard({ onViewProspect }: { onViewProspect?: (id: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setFunnel(data.funnel);
        setUpcomingTasks(data.upcomingTasks || []);
        setOverdueTasks(data.overdueTasks || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(n);
  
  const fmtDate = (d: string) => {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  const fmtDateTime = (d: string) => {
    const date = new Date(d);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  const maxCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <UserGroupIcon className="w-8 h-8 text-blue-500"/>
            <div>
              <p className="text-2xl font-bold">{stats?.totalProspects || 0}</p>
              <p className="text-sm text-gray-500">Totalt prospekter</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-yellow-500"/>
            <div>
              <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
              <p className="text-sm text-gray-500">I prosess</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-8 h-8 text-green-500"/>
            <div>
              <p className="text-2xl font-bold">{stats?.converted || 0}</p>
              <p className="text-sm text-gray-500">Konvertert</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-8 h-8 text-purple-500"/>
            <div>
              <p className="text-2xl font-bold">{fmt(stats?.totalValue || 0)}</p>
              <p className="text-sm text-gray-500">Pipeline verdi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="lg:col-span-2 card">
          <div className="card-header"><h2 className="font-semibold">Salgstrakt</h2></div>
          <div className="card-body space-y-3">
            {funnel.map((stage, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{stage.name}</span>
                  <span className="text-gray-500">{stage.count} stk · {fmt(stage.value)} · {stage.probability}%</span>
                </div>
                <div className="h-8 bg-gray-100 rounded overflow-hidden flex items-center">
                  <div 
                    className={`h-full ${stage.color} flex items-center justify-end pr-2 text-white text-sm font-medium transition-all`}
                    style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 15 : 0)}%` }}
                  >
                    {stage.count > 0 && stage.count}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="font-medium">Total potensiell verdi:</span>
                <span className="font-bold text-green-600">{fmt(funnel.reduce((s, f) => s + f.value, 0))}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Vektet verdi (sannsynlighet):</span>
                <span>{fmt(funnel.reduce((s, f) => s + (f.value * f.probability / 100), 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Oppgaver/Alerts */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="font-semibold">Oppfølging</h2>
            {overdueTasks.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{overdueTasks.length} forfalt</span>
            )}
          </div>
          <div className="card-body space-y-4">
            {overdueTasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">⚠️ FORFALT</p>
                {overdueTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="p-2 bg-red-50 rounded mb-2 text-sm cursor-pointer hover:bg-red-100" onClick={() => onViewProspect?.(t.prospect.id)}>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.prospect.firstName} {t.prospect.lastName} · {fmtDateTime(t.dueDate)}</p>
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Kommende oppgaver</p>
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-400">Ingen kommende oppgaver</p>
              ) : (
                upcomingTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="p-2 bg-gray-50 rounded mb-2 text-sm cursor-pointer hover:bg-gray-100" onClick={() => onViewProspect?.(t.prospect.id)}>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.prospect.firstName} {t.prospect.lastName} · {fmtDateTime(t.dueDate)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kalender denne uken */}
      <div className="card">
        <div className="card-header flex items-center gap-2">
          <CalendarIcon className="w-5 h-5"/>
          <h2 className="font-semibold">Denne uken</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + 1 + i);
              const dayTasks = [...upcomingTasks, ...overdueTasks].filter(t => {
                const taskDate = new Date(t.dueDate);
                return taskDate.toDateString() === date.toDateString();
              });
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`p-2 rounded min-h-24 ${isToday ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'][i]}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-600' : ''}`}>{date.getDate().toString().padStart(2, '0')}</p>
                  <div className="space-y-1 mt-1">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-xs bg-white p-1 rounded truncate cursor-pointer hover:bg-blue-100" onClick={() => onViewProspect?.(t.prospect.id)}>{t.title}</div>
                    ))}
                    {dayTasks.length > 3 && <p className="text-xs text-gray-400">+{dayTasks.length - 3} mer</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hurtiglenker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="https://tax.salestext.no/admin" target="_blank" className="card p-4 hover:shadow-lg transition text-center">
          <p className="font-medium">Tax Admin</p>
          <p className="text-xs text-gray-500">tax.salestext.no</p>
        </a>
        <a href="https://invoice.dtax.no" target="_blank" className="card p-4 hover:shadow-lg transition text-center">
          <p className="font-medium">Fakturering</p>
          <p className="text-xs text-gray-500">invoice.dtax.no</p>
        </a>
        <a href="https://app.brevo.com" target="_blank" className="card p-4 hover:shadow-lg transition text-center">
          <p className="font-medium">Brevo</p>
          <p className="text-xs text-gray-500">E-post</p>
        </a>
        <a href="https://eu-north-1.console.aws.amazon.com/s3" target="_blank" className="card p-4 hover:shadow-lg transition text-center">
          <p className="font-medium">AWS S3</p>
          <p className="text-xs text-gray-500">Dokumenter</p>
        </a>
      </div>
    </div>
  );
}
