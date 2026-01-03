'use client';
import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  DocumentCheckIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardProps {
  onViewProspect: (id: string) => void;
}

interface Stats {
  totalProspects: number;
  newThisWeek: number;
  inProgress: number;
  step6Completed: number;
  totalRevenue: number;
  avgDealSize: number;
}

interface Activity {
  id: string;
  type: string;
  prospect: string;
  description: string;
  time: string;
}

export default function Dashboard({ onViewProspect }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalProspects: 0,
    newThisWeek: 0,
    inProgress: 0,
    step6Completed: 0,
    totalRevenue: 0,
    avgDealSize: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TAX_SUBMITTED': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'INVOICE_CREATED': return <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />;
      case 'CONTRACT_SIGNED': return <DocumentCheckIcon className="w-5 h-5 text-purple-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dtax-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Oversikt over din virksomhet</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-body">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Totalt prospekter</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProspects}</p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Nye denne uken</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newThisWeek}</p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DocumentCheckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Steg 6 fullført</p>
              <p className="text-2xl font-bold text-gray-900">{stats.step6Completed}</p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total omsetning</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Siste aktivitet</h2>
        </div>
        <div className="card-body">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen aktivitet ennå</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.prospect}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
