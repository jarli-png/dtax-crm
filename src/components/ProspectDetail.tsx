'use client';

import { useState } from 'react';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface ProspectDetailProps {
  prospectId: string;
  onBack: () => void;
}

// Demo-data for en prospect
const demoProspect = {
  id: '1',
  firstName: 'Aksel Olav',
  lastName: 'Hillestad',
  email: null,
  phone: '982 94 520',
  address: 'Storgata 1',
  postalCode: '0155',
  city: 'OSLO',
  status: 'STEP_3',
  taxSystemUserId: 'usr_abc123',
  taxSystemStatus: 'ANALYSIS_COMPLETE',
  currentStep: 3,
  invoiceCustomerId: null,
  companies: [
    {
      id: 'c1',
      companyName: 'Dolphin Drilling ASA',
      orgNumber: '123456789',
      role: 'Styreleder',
      deletedDate: '2022-12-15',
      deletionReason: 'Konkurs',
      shareCapitalPaid: 1333877240,
      estimatedTaxValue: 293652992,
    }
  ],
  documents: [
    { id: 'd1', fileName: 'Kontrakt_signert.pdf', fileType: 'contract', createdAt: '2024-12-28', source: 'tax_system' },
    { id: 'd2', fileName: 'Aksjonærbok_Dolphin.pdf', fileType: 'tax_document', createdAt: '2024-12-29', source: 'upload' },
    { id: 'd3', fileName: 'Booppgjør.pdf', fileType: 'tax_document', createdAt: '2024-12-30', source: 'upload' },
  ],
  contracts: [
    { id: 'ct1', type: 'Tjenesteavtale', status: 'SIGNED', signedAt: '2024-12-28', signatureRef: 'bankid_xxx' },
    { id: 'ct2', type: 'Altinn-samtykke', status: 'SIGNED', signedAt: '2024-12-28', signatureRef: 'bankid_yyy' },
  ],
  invoices: [],
  activities: [
    { id: 'a1', type: 'CONTRACT_SIGNED', subject: 'Kontrakt signert med BankID', createdAt: '2024-12-28 14:30' },
    { id: 'a2', type: 'DOCUMENT_UPLOADED', subject: 'Lastet opp: Aksjonærbok_Dolphin.pdf', createdAt: '2024-12-29 09:15' },
    { id: 'a3', type: 'STATUS_CHANGE', subject: 'Status endret til Steg 3 - AI-analyse', createdAt: '2024-12-30 11:00' },
    { id: 'a4', type: 'EMAIL', subject: 'E-post sendt: Analyse klar for gjennomgang', createdAt: '2024-12-30 16:45' },
  ]
};

export default function ProspectDetail({ prospectId, onBack }: ProspectDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'activity' | 'integrations'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const prospect = demoProspect;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(value);
  };

  const getStepProgress = () => {
    const steps = [
      { step: 1, label: 'Kontrakt', done: true },
      { step: 2, label: 'Dokumenter', done: true },
      { step: 3, label: 'AI-analyse', done: true, current: true },
      { step: 4, label: 'Gjennomgang', done: false },
      { step: 5, label: 'Klar', done: false },
      { step: 6, label: 'Sendt', done: false },
    ];
    return steps;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {prospect.firstName} {prospect.lastName}
            </h1>
            <p className="text-gray-500">{prospect.companies[0]?.companyName}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-secondary">
            <PhoneIcon className="w-4 h-4 mr-2" />
            Ring
          </button>
          <button className="btn btn-secondary">
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Send e-post
          </button>
          <button className="btn btn-primary">
            <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
            Åpne i tax.salestext.no
          </button>
        </div>
      </div>

      {/* Stegoversikt */}
      <div className="card card-body">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Fremdrift i tax.salestext.no</h3>
        <div className="flex items-center justify-between">
          {getStepProgress().map((step, idx) => (
            <div key={step.step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step.done ? 'bg-green-500 border-green-500 text-white' :
                step.current ? 'border-dtax-primary text-dtax-primary bg-blue-50' :
                'border-gray-300 text-gray-400'
              }`}>
                {step.done && !step.current ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">{step.step}</span>
                )}
              </div>
              <span className={`ml-2 text-sm ${step.current ? 'font-semibold text-dtax-primary' : 'text-gray-500'}`}>
                {step.label}
              </span>
              {idx < 5 && (
                <div className={`w-12 h-1 mx-2 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Oversikt' },
            { id: 'documents', label: 'Dokumenter' },
            { id: 'activity', label: 'Aktivitet' },
            { id: 'integrations', label: 'Integrasjoner' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-dtax-primary text-dtax-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab-innhold */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kontaktinfo */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="font-semibold">Kontaktinformasjon</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="text-dtax-primary hover:underline text-sm">
                <PencilIcon className="w-4 h-4 inline mr-1" />
                Rediger
              </button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="text-xs text-gray-500">Telefon</label>
                <p className="font-medium">{prospect.phone || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">E-post</label>
                {prospect.email ? (
                  <p className="font-medium">{prospect.email}</p>
                ) : (
                  <button className="text-dtax-primary text-sm hover:underline">+ Legg til e-post</button>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Adresse</label>
                <p className="font-medium">{prospect.address}</p>
                <p className="text-gray-600">{prospect.postalCode} {prospect.city}</p>
              </div>
            </div>
          </div>

          {/* Selskapsinfo */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Selskap</h3>
            </div>
            <div className="card-body">
              {prospect.companies.map((company) => (
                <div key={company.id} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Selskapsnavn</label>
                    <p className="font-medium">{company.companyName}</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <label className="text-xs text-gray-500">Org.nr</label>
                      <p className="font-medium">{company.orgNumber}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Rolle</label>
                      <p className="font-medium">{company.role}</p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <label className="text-xs text-gray-500">Slettet</label>
                      <p className="font-medium">{company.deletedDate}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Årsak</label>
                      <span className="status-badge bg-red-100 text-red-800">{company.deletionReason}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <label className="text-xs text-gray-500">Aksjekapital</label>
                    <p className="text-xl font-bold text-dtax-primary">{formatCurrency(company.shareCapitalPaid)}</p>
                    <p className="text-sm text-gray-500">
                      Estimert skattefordel: <span className="font-semibold text-green-600">{formatCurrency(company.estimatedTaxValue)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kontrakter */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="font-semibold">Signerte kontrakter</h3>
              <button className="text-dtax-primary text-sm hover:underline">Hent fra tax.salestext.no</button>
            </div>
            <div className="card-body">
              {prospect.contracts.length > 0 ? (
                <ul className="space-y-3">
                  {prospect.contracts.map((contract) => (
                    <li key={contract.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        <div>
                          <p className="font-medium text-sm">{contract.type}</p>
                          <p className="text-xs text-gray-500">Signert {contract.signedAt}</p>
                        </div>
                      </div>
                      <button className="text-xs text-dtax-primary hover:underline">Last ned</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Ingen signerte kontrakter</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="font-semibold">Dokumenter</h3>
            <button className="btn btn-primary btn-sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Last opp dokument
            </button>
          </div>
          <div className="card-body p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filnavn</th>
                  <th>Type</th>
                  <th>Kilde</th>
                  <th>Dato</th>
                  <th>Handlinger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prospect.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="flex items-center">
                      <DocumentIcon className="w-5 h-5 text-gray-400 mr-2" />
                      {doc.fileName}
                    </td>
                    <td>
                      <span className="status-badge bg-gray-100 text-gray-800">{doc.fileType}</span>
                    </td>
                    <td>{doc.source === 'tax_system' ? 'tax.salestext.no' : 'Opplastet'}</td>
                    <td>{doc.createdAt}</td>
                    <td>
                      <button className="text-dtax-primary text-sm hover:underline">Last ned</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="font-semibold">Aktivitetslogg</h3>
            <button className="btn btn-secondary btn-sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Legg til notat
            </button>
          </div>
          <div className="card-body p-0">
            <ul className="divide-y divide-gray-200">
              {prospect.activities.map((activity) => (
                <li key={activity.id} className="px-6 py-4 flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.subject}</p>
                    <p className="text-sm text-gray-500">{activity.createdAt}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* tax.salestext.no */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <DocumentIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">tax.salestext.no</h3>
                  <p className="text-xs text-gray-500">Skattetjeneste</p>
                </div>
              </div>
              <span className="status-badge bg-green-100 text-green-800">Koblet</span>
            </div>
            <div className="card-body space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Bruker-ID</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">{prospect.taxSystemUserId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">{prospect.taxSystemStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nåværende steg</span>
                <span className="font-medium">Steg {prospect.currentStep}</span>
              </div>
              <div className="pt-3 border-t flex space-x-2">
                <button className="btn btn-secondary btn-sm flex-1">Synkroniser</button>
                <button className="btn btn-primary btn-sm flex-1">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" />
                  Åpne
                </button>
              </div>
            </div>
          </div>

          {/* invoice.dtax.no */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">invoice.dtax.no</h3>
                  <p className="text-xs text-gray-500">Fakturasystem</p>
                </div>
              </div>
              {prospect.invoiceCustomerId ? (
                <span className="status-badge bg-green-100 text-green-800">Koblet</span>
              ) : (
                <span className="status-badge bg-gray-100 text-gray-800">Ikke koblet</span>
              )}
            </div>
            <div className="card-body">
              {prospect.invoiceCustomerId ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kunde-ID</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{prospect.invoiceCustomerId}</code>
                  </div>
                  <button className="btn btn-secondary btn-sm w-full">Vis fakturaer</button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">Kunde er ikke opprettet i fakturasystemet</p>
                  <button className="btn btn-primary btn-sm">Opprett kunde</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
