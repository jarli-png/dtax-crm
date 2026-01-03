'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ProspectList from '@/components/ProspectList';
import ProspectDetail from '@/components/ProspectDetail';
import Campaigns from '@/components/Campaigns';
import Customers from '@/components/Customers';
import Inbox from '@/components/Inbox';
import Settings from '@/components/Settings';
import LoginPage from '@/components/LoginPage';

type View = 'dashboard' | 'prospects' | 'prospect-detail' | 'campaigns' | 'customers' | 'inbox' | 'settings';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('dtax_crm_token');
    if (token) {
      setIsLoggedIn(true);
      setUser({ name: 'Admin', role: 'ADMIN' });
    }
  }, []);

  const handleLogin = (email: string, password: string) => {
    if (email && password) {
      localStorage.setItem('dtax_crm_token', 'demo_token');
      setIsLoggedIn(true);
      setUser({ name: email.split('@')[0], role: 'ADMIN' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dtax_crm_token');
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleViewProspect = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setCurrentView('prospect-detail');
  };

  const handleBackToList = () => {
    setSelectedProspectId(null);
    setCurrentView('prospects');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        user={user}
      />
      
      <main className="flex-1 ml-64 p-8 bg-gray-50">
        {currentView === 'dashboard' && (
          <Dashboard onViewProspect={handleViewProspect} />
        )}
        
        {currentView === 'prospects' && (
          <ProspectList onViewProspect={handleViewProspect} />
        )}
        
        {currentView === 'prospect-detail' && selectedProspectId && (
          <ProspectDetail 
            prospectId={selectedProspectId} 
            onBack={handleBackToList}
          />
        )}
        
        {currentView === 'customers' && (
          <Customers onViewCustomer={handleViewProspect} />
        )}
        
        {currentView === 'inbox' && (
          <Inbox />
        )}
        
        {currentView === 'campaigns' && (
          <Campaigns />
        )}
        
        {currentView === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
}
