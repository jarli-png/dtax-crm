'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface ProspectListProps {
  onViewProspect: (id: string) => void;
}

const demoProspects = [
  { id: '1', firstName: 'Aksel Olav', lastName: 'Hillestad', email: null, phone: '982 94 520', company: 'Dolphin Drilling ASA', shareCapital: 1333877240, status: 'NEW', deletionReason: 'Konkurs', city: 'OSLO' },
  { id: '2', firstName: 'Joachim Berentz', lastName: 'Flaten', email: null, phone: '996 03 992', company: 'Erteløkka Holding KS', shareCapital: 452015000, status: 'CONTACTED', deletionReason: 'Sletting', city: 'OSLO' },
  { id: '3', firstName: 'Atle', lastName: 'Jacobsen', email: null, phone: '977 15 336', company: 'Dolphin Geophysical AS', shareCapital: 242601000, status: 'IN_PROGRESS', deletionReason: 'Sletting', city: 'STAVANGER' },
  { id: '4', firstName: 'Marta Kristina', lastName: 'Johansson', email: null, phone: '948 12 878', company: 'Cosmetic Group AS', shareCapital: 174240000, status: 'STEP_1', deletionReason: 'Sletting', city: 'BERGEN' },
  { id: '5', firstName: 'Lise Berge', lastName: 'Brattvåg', email: null, phone: '482 79 784', company: 'Per Kroghs Vei 1 KS', shareCapital: 173837345, status: 'STEP_3', deletionReason: 'Sletting', city: 'ÅLESUND' },
  { id: '6', firstName: 'Olav Nils', lastName: 'Sunde', email: null, phone: '936 26 722', company: 'Gresvig Stormarked AS', shareCapital: 165000000, status: 'STEP_6', deletionReason: 'Konkurs', city: 'OSLO' },
  { id: '7', firstName: 'Anne Jorunn', lastName: 'Møkster', email: null, phone: '908 84 431', company: 'Møkster Supply KS', shareCapital: 143950000, status: 'CONVERTED', deletionReason: 'Sletting', city: 'HAUGESUND' },
  { id: '8', firstName: 'Per Olav', lastName: 'Karlsen', email: null, phone: '413 11 464', company: 'Nansen Tankers KS', shareCapital: 143000000, status: 'NEW', deletionReason: 'Sletting', city: 'OSLO' },
];

const statusLabels: Record<string, { label: string; class: string }> = {
  'NEW': { label: 'Ny', class: 'status-new' },
  'CONTACTED': { label: 'Kontaktet', class: 'status-contacted' },
  'IN_PROGRESS': { label: 'I prosess', class: 'status-in-progress' },
  'STEP_1': { label: 'Steg 1', class: 'bg-indigo-100 text-indigo-800' },
  'STEP_3': { label: 'Steg 3', class: 'bg-indigo-100 text-indigo-800' },
  'STEP_6': { label: 'Steg 6 ✓', class: 'status-step-6' },
  'CONVERTED': { label: 'Konvertert', class: 'status-converted' },
};

export default function ProspectList({ onViewProspect }: ProspectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddEmail, setShowAddEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)} mrd kr`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} mill kr`;
    return `${(value / 1000).toFixed(0)}k kr`;
  };

  const filteredProspects = demoProspects
    .filter(p => {
      const matchesSearch = 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.shareCapital - a.shareCapital);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-500">{filteredProspects.length} prospects</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-secondary">
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            Importer
          </button>
          <button className="btn btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Ny prospect
          </button>
        </div>
      </div>

      <div className="card card-body">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Søk på navn eller selskap..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">Alle statuser</option>
            <option value="NEW">Ny</option>
            <option value="CONTACTED">Kontaktet</option>
            <option value="IN_PROGRESS">I prosess</option>
            <option value="STEP_6">Steg 6</option>
            <option value="CONVERTED">Konvertert</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Navn</th>
              <th>Selskap</th>
              <th>Kontakt</th>
              <th>Aksjekapital</th>
              <th>Slettegrunn</th>
              <th>Status</th>
              <th>Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProspects.map((prospect) => (
              <tr key={prospect.id} className="cursor-pointer hover:bg-gray-50">
                <td onClick={() => onViewProspect(prospect.id)}>
                  <div>
                    <p className="font-medium">{prospect.firstName} {prospect.lastName}</p>
                    <p className="text-xs text-gray-500">{prospect.city}</p>
                  </div>
                </td>
                <td onClick={() => onViewProspect(prospect.id)}>
                  <p className="truncate max-w-[200px]">{prospect.company}</p>
                </td>
                <td>
                  <div className="space-y-1">
                    {prospect.phone && (
                      <a href={`tel:${prospect.phone.replace(/\s/g, '')}`} className="flex items-center text-sm text-gray-600 hover:text-dtax-primary">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {prospect.phone}
                      </a>
                    )}
                    {showAddEmail === prospect.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="epost@example.no"
                          className="form-input text-xs py-1 w-40"
                        />
                        <button onClick={() => { setShowAddEmail(null); setNewEmail(''); }} className="text-xs text-dtax-primary">Lagre</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddEmail(prospect.id)} className="flex items-center text-xs text-dtax-primary hover:underline">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        + Legg til e-post
                      </button>
                    )}
                  </div>
                </td>
                <td onClick={() => onViewProspect(prospect.id)}>
                  <span className="font-semibold text-dtax-primary">{formatCurrency(prospect.shareCapital)}</span>
                </td>
                <td onClick={() => onViewProspect(prospect.id)}>
                  <span className={`status-badge ${prospect.deletionReason === 'Konkurs' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {prospect.deletionReason}
                  </span>
                </td>
                <td onClick={() => onViewProspect(prospect.id)}>
                  <span className={`status-badge ${statusLabels[prospect.status]?.class || 'bg-gray-100'}`}>
                    {statusLabels[prospect.status]?.label || prospect.status}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button onClick={() => onViewProspect(prospect.id)} className="text-xs text-dtax-primary hover:underline">Vis</button>
                    <button className="text-xs text-gray-500 hover:underline">E-post</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
