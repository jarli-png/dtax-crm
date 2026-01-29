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
import Users from '@/components/Users';
import LoginPage from '@/components/LoginPage';

type View = 'dashboard' | 'prospects' | 'prospect-detail' | 'campaigns' | 'customers' | 'inbox' | 'settings' | 'users';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  resellerId: string | null;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('dtax_crm_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('dtax_crm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return data.error || 'Innlogging feilet';
      }

      // Store user data
      localStorage.setItem('dtax_crm_user', JSON.stringify(data));
      setUser(data);
      setIsLoggedIn(true);
      return null;
    } catch (err) {
      return 'Kunne ikke koble til serveren';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dtax_crm_user');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleViewProspect = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setCurrentView('prospect-detail');
  };

  const handleBackToList = () => {
    setSelectedProspectId(null);
    setCurrentView('prospects');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        user={user ? { name: user.name, role: user.role, isSuperAdmin: user.isSuperAdmin } : null}
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
        
        {currentView === 'users' && (
          <Users currentUser={user ? { id: user.id, isSuperAdmin: user.isSuperAdmin } : null} />
        )}
        
        {currentView === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
}
