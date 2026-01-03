'use client';

import { 
  HomeIcon, 
  UsersIcon, 
  EnvelopeIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

type View = 'dashboard' | 'prospects' | 'prospect-detail' | 'campaigns' | 'settings';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  user: { name: string; role: string } | null;
}

export default function Sidebar({ currentView, onNavigate, onLogout, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'prospects', label: 'Prospects', icon: UsersIcon },
    { id: 'campaigns', label: 'Kampanjer', icon: EnvelopeIcon },
    { id: 'settings', label: 'Innstillinger', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-dtax-accent">d</span>Tax CRM
        </h1>
        <p className="text-xs text-gray-400 mt-1">Kundestøtte & Salg</p>
      </div>

      {/* Brukerinfo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-dtax-accent flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name || 'Bruker'}</p>
            <p className="text-xs text-gray-400">{user?.role || 'Rolle'}</p>
          </div>
        </div>
      </div>

      {/* Navigasjon */}
      <nav className="mt-4 flex-1">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || 
              (currentView === 'prospect-detail' && item.id === 'prospects');
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id as View)}
                  className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Integrasjoner */}
        <div className="mt-8 px-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Integrasjoner
          </p>
          <ul className="space-y-1">
            <li>
              <a 
                href="https://tax.salestext.no" 
                target="_blank" 
                rel="noopener noreferrer"
                className="sidebar-item text-sm"
              >
                <DocumentTextIcon className="w-4 h-4 mr-3" />
                tax.salestext.no
              </a>
            </li>
            <li>
              <a 
                href="https://invoice.dtax.no" 
                target="_blank" 
                rel="noopener noreferrer"
                className="sidebar-item text-sm"
              >
                <CurrencyDollarIcon className="w-4 h-4 mr-3" />
                invoice.dtax.no
              </a>
            </li>
          </ul>
        </div>

        {/* Statistikk-kort */}
        <div className="mt-8 px-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Denne måneden</span>
              <ChartBarIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">Konvertert</span>
                <span className="text-sm font-semibold text-dtax-success">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">I prosess</span>
                <span className="text-sm font-semibold text-dtax-accent">34</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Logg ut */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Logg ut
        </button>
      </div>
    </aside>
  );
}
