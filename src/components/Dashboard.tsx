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

// Demo-data
const demoStats = {
  totalProspects: 788,
  newThisWeek: 24,
  inProgress: 156,
  step6Completed: 12,
  totalRevenue: 845000,
  avgDealSize: 70416,
};

const demoPipeline = {
  new: [
    { id: '1', name: 'Aksel Olav Hillestad', company: 'Dolphin Drilling ASA', value: 1333877240, status: 'NEW' },
    { id: '2', name: 'Joachim Berentz Flaten', company: 'Erteløkka Holding KS', value: 452015000, status: 'NEW' },
  ],
  contacted: [
    { id: '3', name: 'Atle Jacobsen', company: 'Dolphin Geophysical AS', value: 242601000, status: 'CONTACTED' },
  ],
  inProgress: [
    { id: '4', name: 'Marta Kristina Johansson', company: 'Cosmetic Group AS', value: 174240000, status: 'IN_PROGRESS' },
    { id: '5', name: 'Lise Berge Brattvåg', company: 'Per Kroghs Vei 1 KS', value: 173837345, status: 'IN_PROGRESS' },
  ],
  converted: [
    { id: '6', name: 'Olav Nils Sunde', company: 'Gresvig Stormarked AS', value: 165000000, status: 'CONVERTED' },
  ],
};

const recentActivity = [
  { id: '1', type: 'TAX_SUBMITTED', prospect: 'Olav Nils Sunde', description: 'Skattemelding sendt til Skatteetaten', time: '2 timer siden' },
  { id: '2', type: 'INVOICE_CREATED', prospect: 'Anne Jorunn Møkster', description: 'Faktura opprettet - 45.000 kr', time: '4 timer siden' },
  { id: '3', type: 'CONTRACT_SIGNED', prospect: 'Per Olav Karlsen', description: 'Kontrakt signert med BankID', time: '5 timer siden' },
  { id: '4', type: 'EMAIL', prospect: 'Marta Kristina Johansson', description: 'E-post sendt: Velkommen til dTax', time: '6 timer siden' },
  { id: '5', type: 'STATUS_CHANGE', prospect: 'Atle Jacobsen', description: 'Status endret til "Kontaktet"', time: '1 dag siden' },
];

export default function Dashboard({ onViewProspect }: DashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} mrd`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} mill`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TAX_SUBMITTED': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'INVOICE_CREATED': return <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />;
      case 'CONTRACT_SIGNED': return <DocumentCheckIcon className="w-5 h-5 text-purple-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Oversikt over salg og konverteringer</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-secondary">
            Last ned rapport
          </button>
          <button className="btn btn-primary">
            + Ny prospect
          </button>
        </div>
      </div>

      {/* Statistikk-kort */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Totalt prospects</p>
              <p className="text-3xl font-bold text-gray-900">{demoStats.totalProspects}</p>
              <p className="text-sm text-green-600 mt-1">+{demoStats.newThisWeek} denne uken</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">I prosess</p>
              <p className="text-3xl font-bold text-gray-900">{demoStats.inProgress}</p>
              <p className="text-sm text-gray-500 mt-1">Steg 1-5</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Steg 6 fullført</p>
              <p className="text-3xl font-bold text-gray-900">{demoStats.step6Completed}</p>
              <p className="text-sm text-green-600 mt-1">Denne måneden</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total omsetning</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(demoStats.totalRevenue)}</p>
              <p className="text-sm text-gray-500 mt-1">Snitt: {formatCurrency(demoStats.avgDealSize)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline og aktivitet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Salgs-pipeline</h2>
            <select className="text-sm border-gray-300 rounded-md">
              <option>Denne måneden</option>
              <option>Siste 3 måneder</option>
              <option>I år</option>
            </select>
          </div>
          <div className="card-body">
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {/* Ny */}
              <div className="pipeline-column">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">Ny</h3>
                  <span className="status-badge status-new">{demoPipeline.new.length}</span>
                </div>
                {demoPipeline.new.map((prospect) => (
                  <div 
                    key={prospect.id} 
                    className="pipeline-card"
                    onClick={() => onViewProspect(prospect.id)}
                  >
                    <p className="font-medium text-gray-900 truncate">{prospect.name}</p>
                    <p className="text-sm text-gray-500 truncate">{prospect.company}</p>
                    <p className="text-sm font-semibold text-dtax-primary mt-2">
                      {formatNumber(prospect.value)} kr
                    </p>
                  </div>
                ))}
              </div>

              {/* Kontaktet */}
              <div className="pipeline-column">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">Kontaktet</h3>
                  <span className="status-badge status-contacted">{demoPipeline.contacted.length}</span>
                </div>
                {demoPipeline.contacted.map((prospect) => (
                  <div 
                    key={prospect.id} 
                    className="pipeline-card"
                    onClick={() => onViewProspect(prospect.id)}
                  >
                    <p className="font-medium text-gray-900 truncate">{prospect.name}</p>
                    <p className="text-sm text-gray-500 truncate">{prospect.company}</p>
                    <p className="text-sm font-semibold text-dtax-primary mt-2">
                      {formatNumber(prospect.value)} kr
                    </p>
                  </div>
                ))}
              </div>

              {/* I prosess */}
              <div className="pipeline-column">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">I prosess</h3>
                  <span className="status-badge status-in-progress">{demoPipeline.inProgress.length}</span>
                </div>
                {demoPipeline.inProgress.map((prospect) => (
                  <div 
                    key={prospect.id} 
                    className="pipeline-card"
                    onClick={() => onViewProspect(prospect.id)}
                  >
                    <p className="font-medium text-gray-900 truncate">{prospect.name}</p>
                    <p className="text-sm text-gray-500 truncate">{prospect.company}</p>
                    <p className="text-sm font-semibold text-dtax-primary mt-2">
                      {formatNumber(prospect.value)} kr
                    </p>
                  </div>
                ))}
              </div>

              {/* Konvertert */}
              <div className="pipeline-column bg-green-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">Konvertert ✓</h3>
                  <span className="status-badge status-converted">{demoPipeline.converted.length}</span>
                </div>
                {demoPipeline.converted.map((prospect) => (
                  <div 
                    key={prospect.id} 
                    className="pipeline-card border-green-200"
                    onClick={() => onViewProspect(prospect.id)}
                  >
                    <p className="font-medium text-gray-900 truncate">{prospect.name}</p>
                    <p className="text-sm text-gray-500 truncate">{prospect.company}</p>
                    <p className="text-sm font-semibold text-green-600 mt-2">
                      {formatNumber(prospect.value)} kr
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Siste aktivitet */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Siste aktivitet</h2>
          </div>
          <div className="card-body p-0">
            <ul className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.prospect}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="px-6 py-3 border-t border-gray-200">
            <button className="text-sm text-dtax-primary hover:underline">
              Se all aktivitet →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
