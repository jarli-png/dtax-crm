'use client';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  currentStep: number;
  companies: { name: string; shareCapitalPaid: number }[];
  createdAt: string;
}

interface ProspectListProps {
  onViewProspect: (id: string) => void;
}

export default function ProspectList({ onViewProspect }: ProspectListProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const response = await fetch('/api/prospects');
      if (response.ok) {
        const data = await response.json();
        setProspects(data);
      }
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProspects = prospects.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
      CONVERTED: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(value);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospekter</h1>
          <p className="text-gray-500">{prospects.length} totalt</p>
        </div>
        <button className="btn btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Legg til prospekt
        </button>
      </div>

      <div className="card">
        <div className="card-header flex items-center space-x-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter navn, e-post..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="form-input w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Alle statuser</option>
            <option value="NEW">Ny</option>
            <option value="CONTACTED">Kontaktet</option>
            <option value="QUALIFIED">Kvalifisert</option>
            <option value="IN_PROGRESS">I prosess</option>
            <option value="CONVERTED">Konvertert</option>
            <option value="LOST">Tapt</option>
          </select>
        </div>

        <div className="table-container">
          {filteredProspects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen prospekter funnet</p>
              <p className="text-sm text-gray-400 mt-2">Legg til prospekter eller importer fra fil</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>E-post</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>Steg</th>
                  <th>Opprettet</th>
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((prospect) => (
                  <tr 
                    key={prospect.id} 
                    onClick={() => onViewProspect(prospect.id)}
                    className="cursor-pointer"
                  >
                    <td className="font-medium">{prospect.firstName} {prospect.lastName}</td>
                    <td>{prospect.email || '-'}</td>
                    <td>{prospect.phone || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(prospect.status)}`}>
                        {prospect.status}
                      </span>
                    </td>
                    <td>{prospect.currentStep}/6</td>
                    <td>{new Date(prospect.createdAt).toLocaleDateString('nb-NO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
