'use client';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  companyName: string;
  orgNumber: string;
  shareCapitalPaid: number;
  role: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phone2: string;
  address: string;
  postalCode: string;
  city: string;
  status: string;
  currentStep: number;
  notes: string;
  companies: Company[];
  activities: Activity[];
  createdAt: string;
}

interface ProspectDetailProps {
  prospectId: string;
  onBack: () => void;
}

export default function ProspectDetail({ prospectId, onBack }: ProspectDetailProps) {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProspect();
  }, [prospectId]);

  const fetchProspect = async () => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}`);
      if (response.ok) {
        const data = await response.json();
        setProspect(data);
      }
    } catch (error) {
      console.error('Failed to fetch prospect:', error);
    } finally {
      setLoading(false);
    }
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

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Prospekt ikke funnet</p>
        <button onClick={onBack} className="btn btn-secondary mt-4">Tilbake</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {prospect.firstName} {prospect.lastName}
          </h1>
          <p className="text-gray-500">Steg {prospect.currentStep} av 6</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kontaktinfo */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Kontaktinformasjon</h2>
          </div>
          <div className="card-body space-y-3">
            <div>
              <p className="text-sm text-gray-500">E-post</p>
              <p className="font-medium">{prospect.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="font-medium">{prospect.phone || '-'}</p>
            </div>
            {prospect.phone2 && (
              <div>
                <p className="text-sm text-gray-500">Telefon 2</p>
                <p className="font-medium">{prospect.phone2}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-medium">
                {prospect.address ? `${prospect.address}, ${prospect.postalCode} ${prospect.city}` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Selskaper */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Selskaper</h2>
          </div>
          <div className="card-body">
            {prospect.companies.length === 0 ? (
              <p className="text-gray-500">Ingen selskaper registrert</p>
            ) : (
              <div className="space-y-3">
                {prospect.companies.map((company) => (
                  <div key={company.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{company.companyName}</p>
                    <p className="text-sm text-gray-500">Org.nr: {company.orgNumber}</p>
                    <p className="text-sm text-gray-500">Rolle: {company.role}</p>
                    <p className="text-sm font-medium text-green-600">
                      Innbetalt: {formatCurrency(company.shareCapitalPaid || 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aktivitet */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold">Aktivitet</h2>
            <button className="btn btn-primary btn-sm">
              <PaperAirplaneIcon className="w-4 h-4 mr-1" />
              Send e-post
            </button>
          </div>
          <div className="card-body">
            {prospect.activities?.length === 0 ? (
              <p className="text-gray-500">Ingen aktivitet ennå</p>
            ) : (
              <div className="space-y-3">
                {prospect.activities?.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-gray-200 pl-3">
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleString('nb-NO')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notater */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Notater</h2>
        </div>
        <div className="card-body">
          <textarea
            className="form-input"
            rows={4}
            placeholder="Legg til notater..."
            defaultValue={prospect.notes || ''}
          />
        </div>
      </div>
    </div>
  );
}
