'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      SENDING: 'bg-blue-100 text-blue-800',
      SENT: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">E-postkampanjer</h1>
          <p className="text-gray-500">{campaigns.length} kampanjer</p>
        </div>
        <button className="btn btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Ny kampanje
        </button>
      </div>

      <div className="card">
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <PaperAirplaneIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Ingen kampanjer ennå</p>
            <p className="text-sm text-gray-400 mt-2">Opprett din første e-postkampanje</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Navn</th>
                <th>Emne</th>
                <th>Status</th>
                <th>Sendt</th>
                <th>Åpnet</th>
                <th>Klikket</th>
                <th>Opprettet</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="cursor-pointer hover:bg-gray-50">
                  <td className="font-medium">{campaign.name}</td>
                  <td>{campaign.subject}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td>{campaign.sentCount}</td>
                  <td>{campaign.openedCount}</td>
                  <td>{campaign.clickedCount}</td>
                  <td>{new Date(campaign.createdAt).toLocaleDateString('nb-NO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
