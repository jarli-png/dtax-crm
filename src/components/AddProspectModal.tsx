'use client';
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddProspectModal({ onClose, onAdded }: Props) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', phone2: '',
    address: '', postalCode: '', city: '',
    companyName: '', orgNumber: '', role: '', shareCapital: '', deletedDate: '', deletionReason: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.firstName || !form.lastName) {
      setError('Fornavn og etternavn er påkrevd');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || null,
          phone: form.phone || null,
          phone2: form.phone2 || null,
          address: form.address || null,
          postalCode: form.postalCode || null,
          city: form.city || null,
          company: form.companyName ? {
            companyName: form.companyName,
            orgNumber: form.orgNumber || '',
            role: form.role || null,
            shareCapitalPaid: form.shareCapital ? parseFloat(form.shareCapital) : null,
            deletedDate: form.deletedDate || null,
            deletionReason: form.deletionReason || null
          } : null
        })
      });
      if (res.ok) {
        onAdded();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Feil ved lagring');
      }
    } catch (e) { setError('Nettverksfeil'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Legg til prospect</h2>
          <button onClick={onClose}><XMarkIcon className="w-6 h-6"/></button>
        </div>
        <div className="p-4 space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">Fornavn *</label><input className="form-input" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></div>
            <div><label className="text-sm text-gray-600">Etternavn *</label><input className="form-input" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">E-post</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div><label className="text-sm text-gray-600">Telefon</label><input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          </div>
          
          <div><label className="text-sm text-gray-600">Telefon 2</label><input className="form-input" value={form.phone2} onChange={e=>setForm({...form,phone2:e.target.value})}/></div>
          
          <div><label className="text-sm text-gray-600">Adresse</label><input className="form-input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">Postnr</label><input className="form-input" value={form.postalCode} onChange={e=>setForm({...form,postalCode:e.target.value})}/></div>
            <div><label className="text-sm text-gray-600">Poststed</label><input className="form-input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
          </div>
          
          <hr/>
          <p className="text-sm font-medium text-gray-700">Selskap (valgfritt)</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">Selskapsnavn</label><input className="form-input" value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})}/></div>
            <div><label className="text-sm text-gray-600">Org.nr</label><input className="form-input" value={form.orgNumber} onChange={e=>setForm({...form,orgNumber:e.target.value})}/></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">Rolle</label><input className="form-input" placeholder="Styreleder, Daglig leder..." value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/></div>
            <div><label className="text-sm text-gray-600">Aksjekapital</label><input className="form-input" type="number" value={form.shareCapital} onChange={e=>setForm({...form,shareCapital:e.target.value})}/></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-600">Slettedato</label><input className="form-input" type="date" value={form.deletedDate} onChange={e=>setForm({...form,deletedDate:e.target.value})}/></div>
            <div><label className="text-sm text-gray-600">Slettegrunn</label><input className="form-input" placeholder="Konkurs, Sletting..." value={form.deletionReason} onChange={e=>setForm({...form,deletionReason:e.target.value})}/></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="btn btn-secondary">Avbryt</button>
          <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'Lagrer...' : 'Lagre'}</button>
        </div>
      </div>
    </div>
  );
}
