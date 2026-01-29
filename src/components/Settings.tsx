'use client';
import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    companyName: 'dTax Lier',
    email: 'kundeservice@dtax.no',
    phone: '',
    address: '',
    defaultBcc: '',
    brevoApiKey: '',
    taxSystemApiKey: '',
    taxSystemApiUrl: 'https://tax.salestext.no/api',
    invoiceSystemApiKey: '',
    invoiceSystemApiUrl: 'https://invoice.dtax.no/api',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Innstillinger</h1>
        <p className="text-gray-500">Konfigurer systemet</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Firmainformasjon</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="form-label">Firmanavn</label>
            <input
              type="text"
              className="form-input"
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">E-post</label>
            <input
              type="email"
              className="form-input"
              value={settings.email}
              onChange={(e) => setSettings({...settings, email: e.target.value})}
            />
          </div>
          <div>
            <label className="form-label">Telefon</label>
            <input
              type="tel"
              className="form-input"
              value={settings.phone}
              onChange={(e) => setSettings({...settings, phone: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">E-postinnstillinger</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="form-label">Standard blindkopi (BCC)</label>
            <input
              type="email"
              className="form-input"
              placeholder="din@epost.no"
              value={settings.defaultBcc}
              onChange={(e) => setSettings({...settings, defaultBcc: e.target.value})}
            />
            <p className="text-sm text-gray-500 mt-1">Alle utgående e-poster sendes også hit</p>
          </div>
          <div>
            <label className="form-label">Brevo API-nøkkel</label>
            <input
              type="password"
              className="form-input"
              placeholder="xkeysib-..."
              value={settings.brevoApiKey}
              onChange={(e) => setSettings({...settings, brevoApiKey: e.target.value})}
            />
            <p className="text-sm text-gray-500 mt-1">For e-postutsendelse via Brevo</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">API-integrasjoner</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Tax System API URL</label>
              <input
                type="url"
                className="form-input"
                value={settings.taxSystemApiUrl}
                onChange={(e) => setSettings({...settings, taxSystemApiUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Tax System API-nøkkel</label>
              <input
                type="password"
                className="form-input"
                placeholder="..."
                value={settings.taxSystemApiKey}
                onChange={(e) => setSettings({...settings, taxSystemApiKey: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Invoice System API URL</label>
              <input
                type="url"
                className="form-input"
                value={settings.invoiceSystemApiUrl}
                onChange={(e) => setSettings({...settings, invoiceSystemApiUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Invoice System API-nøkkel</label>
              <input
                type="password"
                className="form-input"
                placeholder="..."
                value={settings.invoiceSystemApiKey}
                onChange={(e) => setSettings({...settings, invoiceSystemApiKey: e.target.value})}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn btn-primary">
          {saved ? (
            <>
              <CheckIcon className="w-5 h-5 mr-2" />
              Lagret!
            </>
          ) : (
            'Lagre innstillinger'
          )}
        </button>
      </div>
    </div>
  );
}
