'use client';

import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [emailSettings, setEmailSettings] = useState({
    fromEmail: 'noreply@dtax.no',
    bccEmail: 'arkiv@dtax.no',
    supportEmail: 'support@dtax.no',
    salesEmail: 'sales@dtax.no',
  });

  const [apiSettings, setApiSettings] = useState({
    taxSystemUrl: 'https://tax.salestext.no',
    taxSystemConnected: true,
    invoiceSystemUrl: 'https://invoice.dtax.no',
    invoiceSystemConnected: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>
        <p className="text-gray-500">Konfigurer CRM-systemet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E-postinnstillinger */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">E-postinnstillinger</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">Avsender-e-post</label>
              <input
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                className="form-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">E-postadressen som vises som avsender</p>
            </div>
            <div>
              <label className="form-label">Blindkopi (BCC)</label>
              <input
                type="email"
                value={emailSettings.bccEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, bccEmail: e.target.value })}
                className="form-input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Alle utgående e-poster sendes i kopi hit</p>
            </div>
            <div>
              <label className="form-label">Support-e-post</label>
              <input
                type="email"
                value={emailSettings.supportEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, supportEmail: e.target.value })}
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="form-label">Salg-e-post</label>
              <input
                type="email"
                value={emailSettings.salesEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, salesEmail: e.target.value })}
                className="form-input w-full"
              />
            </div>
            <button className="btn btn-primary">Lagre e-postinnstillinger</button>
          </div>
        </div>

        {/* API-integrasjoner */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">API-integrasjoner</h2>
          </div>
          <div className="card-body space-y-4">
            {/* tax.salestext.no */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h3 className="font-medium">tax.salestext.no</h3>
                  {apiSettings.taxSystemConnected ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 ml-2" />
                  )}
                </div>
                <span className={`status-badge ${apiSettings.taxSystemConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {apiSettings.taxSystemConnected ? 'Tilkoblet' : 'Frakoblet'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">API URL</label>
                  <input type="text" value={apiSettings.taxSystemUrl} className="form-input w-full text-sm" readOnly />
                </div>
                <div>
                  <label className="text-xs text-gray-500">API-nøkkel</label>
                  <input type="password" value="••••••••••••••••" className="form-input w-full text-sm" />
                </div>
                <button className="btn btn-secondary btn-sm">Test tilkobling</button>
              </div>
            </div>

            {/* invoice.dtax.no */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h3 className="font-medium">invoice.dtax.no</h3>
                  {apiSettings.invoiceSystemConnected ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 ml-2" />
                  )}
                </div>
                <span className={`status-badge ${apiSettings.invoiceSystemConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {apiSettings.invoiceSystemConnected ? 'Tilkoblet' : 'Frakoblet'}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">API URL</label>
                  <input type="text" value={apiSettings.invoiceSystemUrl} className="form-input w-full text-sm" readOnly />
                </div>
                <div>
                  <label className="text-xs text-gray-500">API-nøkkel</label>
                  <input type="password" value="••••••••••••••••" className="form-input w-full text-sm" />
                </div>
                <button className="btn btn-secondary btn-sm">Test tilkobling</button>
              </div>
            </div>

            {/* AWS SES */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <h3 className="font-medium">AWS SES (E-post)</h3>
                  <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                </div>
                <span className="status-badge bg-green-100 text-green-800">Aktiv</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Region</label>
                  <input type="text" value="eu-north-1" className="form-input w-full text-sm" readOnly />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Verifisert domene</label>
                  <input type="text" value="dtax.no" className="form-input w-full text-sm" readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brukerinnstillinger */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Brukere</h2>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>E-post</th>
                  <th>Rolle</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="font-medium">Admin</td>
                  <td>admin@dtax.no</td>
                  <td><span className="status-badge bg-purple-100 text-purple-800">Admin</span></td>
                  <td><span className="status-badge bg-green-100 text-green-800">Aktiv</span></td>
                </tr>
                <tr>
                  <td className="font-medium">Jarl-Gunnar</td>
                  <td>jgl@salestext.no</td>
                  <td><span className="status-badge bg-purple-100 text-purple-800">Admin</span></td>
                  <td><span className="status-badge bg-green-100 text-green-800">Aktiv</span></td>
                </tr>
              </tbody>
            </table>
            <button className="btn btn-secondary mt-4">+ Legg til bruker</button>
          </div>
        </div>

        {/* Import */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Import av prospects</h2>
          </div>
          <div className="card-body">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">Dra og slipp Excel-fil her, eller</p>
              <button className="btn btn-primary">Velg fil</button>
              <p className="text-xs text-gray-400 mt-2">Støtter .xlsx og .csv</p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Siste import</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">CRM_788_med_telefon_KLAR.xlsx</p>
                <p className="text-xs text-gray-500">788 prospects importert - 3. januar 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
