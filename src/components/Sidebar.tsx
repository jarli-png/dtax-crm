'use client';
import { useState, useEffect } from 'react';
import { HomeIcon, UserGroupIcon, UsersIcon, InboxIcon, EnvelopeIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

type View = 'dashboard' | 'prospects' | 'prospect-detail' | 'campaigns' | 'customers' | 'inbox' | 'settings' | 'users';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  user: { name: string; role: string; isSuperAdmin?: boolean } | null;
}

interface Stats {
  converted: number;
  inProgress: number;
  overdueTasks: number;
}

export default function Sidebar({ currentView, onNavigate, onLogout, user }: SidebarProps) {
  const [stats, setStats] = useState<Stats>({ converted: 0, inProgress: 0, overdueTasks: 0 });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/sidebar');
      if (res.ok) setStats(await res.json());
    } catch (e) {}
  };

  const menuItems = [
    { id: 'dashboard' as View, icon: HomeIcon, label: 'Dashboard' },
    { id: 'prospects' as View, icon: UserGroupIcon, label: 'Prospekter' },
    { id: 'customers' as View, icon: UsersIcon, label: 'Kunder' },
    { id: 'inbox' as View, icon: InboxIcon, label: 'Innboks' },
    { id: 'campaigns' as View, icon: EnvelopeIcon, label: 'Kampanjer' },
    { id: 'users' as View, icon: UserCircleIcon, label: 'Brukere' },
    { id: 'settings' as View, icon: Cog6ToothIcon, label: 'Innstillinger' },
  ];

  return (
    <div className="w-64 bg-dtax-dark text-white flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-dtax-primary">dTax CRM</h1>
        <p className="text-xs text-gray-400">Kundestøtte & Salg</p>
      </div>

      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-dtax-primary rounded-full flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-medium">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400">
              {user?.role || 'ADMIN'}
              {user?.isSuperAdmin && ' • SuperAdmin'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              currentView === item.id || (currentView === 'prospect-detail' && item.id === 'prospects')
                ? 'bg-dtax-primary text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-1">INTEGRASJONER</p>
        <a href="https://tax.salestext.no" target="_blank" className="block text-sm text-gray-300 hover:text-white py-1">↗ tax.salestext.no</a>
        <a href="https://invoice.dtax.no" target="_blank" className="block text-sm text-gray-300 hover:text-white py-1">↗ invoice.dtax.no</a>
      </div>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Denne måneden
        </p>
        <div className="flex justify-between text-sm">
          <span>Konvertert</span>
          <span className="text-green-400 font-medium">{stats.converted}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>I prosess</span>
          <span className="text-yellow-400 font-medium">{stats.inProgress}</span>
        </div>
        {stats.overdueTasks > 0 && (
          <div className="flex justify-between text-sm mt-2 text-red-400">
            <span>⚠️ Forfalt</span>
            <span className="font-medium">{stats.overdueTasks}</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <button onClick={onLogout} className="w-full flex items-center space-x-2 text-gray-400 hover:text-white">
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          <span>Logg ut</span>
        </button>
      </div>
    </div>
  );
}
