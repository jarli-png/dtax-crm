'use client';

import { useState } from 'react';
import { PlusIcon, PaperAirplaneIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const demoCampaigns = [
  { id: '1', name: 'Velkommen til dTax', status: 'SENT', sentCount: 156, openedCount: 89, clickedCount: 34, sentAt: '2024-12-20' },
  { id: '2', name: 'Frist for skattemelding', status: 'DRAFT', sentCount: 0, openedCount: 0, clickedCount: 0, sentAt: null },
  { id: '3', name: 'Oppfølging - Ikke startet', status: 'SCHEDULED', sentCount: 0, openedCount: 0, clickedCount: 0, sentAt: '2025-01-05' },
];

export default function Campaigns() {
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-postkampanjer</h1>
          <p className="text-gray-500">Send målrettede e-poster til prospects</p>
        </div>
        <button onClick={() => setShowNewCampaign(true)} className="btn btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Ny kampanje
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sendt totalt</p>
              <p className="text-3xl font-bold">156</p>
            </div>
            <PaperAirplaneIcon className="w-8 h-8 text-dtax-primary" />
          </div>
        </div>
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Åpningsrate</p>
              <p className="text-3xl font-bold">57%</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Klikkrate</p>
              <p className="text-3xl font-bold">22%</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">Kampanjer</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Navn</th>
              <th>Status</th>
              <th>Sendt</th>
              <th>Åpnet</th>
              <th>Klikket</th>
              <th>Dato</th>
              <th>Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {demoCampaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="font-medium">{campaign.name}</td>
                <td>
                  <span className={`status-badge ${
                    campaign.status === 'SENT' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status === 'SENT' ? 'Sendt' : campaign.status === 'DRAFT' ? 'Utkast' : 'Planlagt'}
                  </span>
                </td>
                <td>{campaign.sentCount}</td>
                <td>{campaign.openedCount} ({campaign.sentCount > 0 ? Math.round(campaign.openedCount / campaign.sentCount * 100) : 0}%)</td>
                <td>{campaign.clickedCount} ({campaign.sentCount > 0 ? Math.round(campaign.clickedCount / campaign.sentCount * 100) : 0}%)</td>
                <td>{campaign.sentAt || '-'}</td>
                <td>
                  <button className="text-dtax-primary text-sm hover:underline">
                    {campaign.status === 'DRAFT' ? 'Rediger' : 'Vis'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for ny kampanje */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Ny e-postkampanje</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Kampanjenavn</label>
                <input type="text" className="form-input w-full" placeholder="F.eks. Januarkampanje" />
              </div>
              <div>
                <label className="form-label">Emne</label>
                <input type="text" className="form-input w-full" placeholder="E-postens emnelinje" />
              </div>
              <div>
                <label className="form-label">Innhold</label>
                <textarea className="form-input w-full h-40" placeholder="Skriv e-postinnholdet her..."></textarea>
                <p className="text-xs text-gray-500 mt-1">Bruk {"{{firstName}}"} og {"{{lastName}}"} for personalisering</p>
              </div>
              <div>
                <label className="form-label">Mottakere</label>
                <select className="form-input w-full">
                  <option>Alle prospects (788)</option>
                  <option>Nye prospects (124)</option>
                  <option>I prosess (156)</option>
                  <option>Konkurs-saker (350)</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => setShowNewCampaign(false)} className="btn btn-secondary">Avbryt</button>
              <button className="btn btn-primary">Lagre utkast</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
