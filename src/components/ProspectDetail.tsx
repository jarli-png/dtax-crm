'use client';
import { normalizeToE164, makeTelHref, formatPhoneDisplay, wasCalledRecently, formatLastCalled } from '@/lib/phone';
import { useState, useEffect } from 'react';
import { ArrowLeftIcon, PencilIcon, CheckIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  companyName: string;
  orgNumber: string;
  shareCapitalPaid: number;
  role: string;
  deletedDate: string;
  deletionReason: string;
  brrregUrl: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Note {
  id: string;
  content: string;
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
  notes: string;
  lastCalledAt: string | null;
  companies: Company[];
  tasks: Task[];
  notesList: Note[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; probability: number; color: string }> = {
  'NEW': { label: 'Ny', probability: 5, color: 'bg-gray-400' },
  'CONTACTED': { label: 'Kontaktet', probability: 10, color: 'bg-blue-400' },
  'QUALIFIED': { label: 'Kvalifisert', probability: 25, color: 'bg-blue-500' },
  'IN_PROGRESS': { label: 'I prosess', probability: 40, color: 'bg-yellow-500' },
  'STEP_1': { label: 'Steg 1', probability: 45, color: 'bg-yellow-500' },
  'STEP_2': { label: 'Steg 2', probability: 50, color: 'bg-yellow-600' },
  'STEP_3': { label: 'Steg 3', probability: 60, color: 'bg-orange-500' },
  'STEP_4': { label: 'Steg 4', probability: 70, color: 'bg-orange-500' },
  'STEP_5': { label: 'Steg 5', probability: 80, color: 'bg-orange-600' },
  'STEP_6': { label: 'Steg 6 - Sendt', probability: 90, color: 'bg-green-500' },
  'CONVERTED': { label: 'Konvertert', probability: 100, color: 'bg-green-600' },
  'LOST': { label: 'Tapt', probability: 0, color: 'bg-red-500' },
};

const FUNNEL_STEPS = ['NEW', 'CONTACTED', 'QUALIFIED', 'IN_PROGRESS', 'STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5', 'STEP_6', 'CONVERTED'];

export default function ProspectDetail({ prospectId, onBack }: { prospectId: string; onBack: () => void }) {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<any>({});
  const [companyForm, setCompanyForm] = useState<any>({});
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [msg, setMsg] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '' });

  useEffect(() => { fetchProspect(); }, [prospectId]);

  const fetchProspect = async () => {
    try {
      const res = await fetch(`/api/prospects/${prospectId}`);
      if (res.ok) {
        const data = await res.json();
        setProspect(data);
        setContactForm(data);
        setNotes(data.notesList || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCall = async (phone: string | null) => {
    if (!phone) return;
    try {
      await fetch(`/api/prospects/${prospectId}/call`, { method: 'POST' });
      fetchProspect();
    } catch (e) { console.error('Failed to update call status:', e); }
    window.location.href = makeTelHref(normalizeToE164(phone));
  };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2000); };

  const fmtDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  };

  const fmtDateTime = (d: string) => {
    const date = new Date(d);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const saveContact = async () => {
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contactForm.firstName,
          lastName: contactForm.lastName,
          email: contactForm.email,
          phone: contactForm.phone,
          phone2: contactForm.phone2,
          address: contactForm.address,
          postalCode: contactForm.postalCode,
          city: contactForm.city
        })
      });
      if (res.ok) { showMsg('✓ Lagret'); fetchProspect(); setEditingContact(false); }
      else showMsg('✗ Feil');
    } catch (e) { showMsg('✗ Feil'); }
  };

  const saveCompany = async (companyId: string) => {
    try {
      const res = await fetch(`/api/prospects/${prospectId}/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyForm)
      });
      if (res.ok) { showMsg('✓ Lagret'); fetchProspect(); setEditingCompany(null); }
      else showMsg('✗ Feil');
    } catch (e) { showMsg('✗ Feil'); }
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchProspect();
    showMsg(`✓ Status endret til ${STATUS_CONFIG[status]?.label || status}`);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/prospects/${prospectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      });
      if (res.ok) { setNewNote(''); fetchProspect(); showMsg('✓ Notat lagret'); }
    } catch (e) { showMsg('✗ Feil'); }
  };

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/prospects/${prospectId}/notes/${noteId}`, { method: 'DELETE' });
    fetchProspect();
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.dueDate) return;
    await fetch(`/api/prospects/${prospectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    setNewTask({ title: '', dueDate: '' });
    setShowTaskForm(false);
    fetchProspect();
    showMsg('✓ Oppgave lagt til');
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await fetch(`/api/prospects/${prospectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
    fetchProspect();
  };

  const fmt = (n: number) => new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(n);
  
  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;
  if (!prospect) return <div className="text-center py-12"><p>Ikke funnet</p><button onClick={onBack} className="btn btn-secondary mt-4">Tilbake</button></div>;

  const totalCap = prospect.companies.reduce((s, c) => s + (Number(c.shareCapitalPaid) || 0), 0);
  const taxBenefit = totalCap * 0.22;
  const dtaxValue = taxBenefit * 0.30;
  const statusConfig = STATUS_CONFIG[prospect.status] || { probability: 0, label: prospect.status, color: 'bg-gray-400' };
  const weightedValue = dtaxValue * (statusConfig.probability / 100);
  const currentStepIndex = FUNNEL_STEPS.indexOf(prospect.status);
  const calledRecently = wasCalledRecently(prospect.lastCalledAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded"><ArrowLeftIcon className="w-5 h-5"/></button>
          <div>
            <p className="text-xs text-gray-400">ID: {prospect.id.slice(0,8)}</p>
            <h1 className="text-2xl font-bold">{prospect.firstName} {prospect.lastName}</h1>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
        </div>
      </div>

      {/* Funnel-visualisering */}
      <div className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Salgsprosess</h3>
          <span className={`px-3 py-1 rounded-full text-white text-sm ${statusConfig.color}`}>
            {statusConfig.label} ({statusConfig.probability}%)
          </span>
        </div>
        <div className="flex gap-1 mb-4">
          {FUNNEL_STEPS.map((step, i) => {
            const config = STATUS_CONFIG[step];
            const isActive = i <= currentStepIndex && prospect.status !== 'LOST';
            const isCurrent = step === prospect.status;
            return (
              <button
                key={step}
                onClick={() => updateStatus(step)}
                className={`flex-1 h-3 rounded transition-all ${isActive ? config.color : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-offset-1 ring-blue-500' : ''} hover:opacity-80`}
                title={`${config.label} (${config.probability}%)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Ny</span>
          <span>Kontaktet</span>
          <span>Kvalifisert</span>
          <span>I prosess</span>
          <span>Steg 1-5</span>
          <span>Sendt</span>
          <span>Konvertert</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => updateStatus('LOST')} className={`px-3 py-1 text-sm rounded ${prospect.status === 'LOST' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
            Merk som tapt
          </button>
          {prospect.status === 'LOST' && (
            <button onClick={() => updateStatus('NEW')} className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200">
              Gjenåpne
            </button>
          )}
        </div>
      </div>

      {/* Verdikort */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 bg-blue-50">
          <p className="text-xs text-blue-600">Aksjekapital</p>
          <p className="text-xl font-bold">{fmt(totalCap)}</p>
        </div>
        <div className="card p-4 bg-green-50">
          <p className="text-xs text-green-600">Skattefordel (22%)</p>
          <p className="text-xl font-bold">{fmt(taxBenefit)}</p>
        </div>
        <div className="card p-4 bg-purple-50">
          <p className="text-xs text-purple-600">dTax verdi (30%)</p>
          <p className="text-xl font-bold">{fmt(dtaxValue)}</p>
        </div>
        <div className="card p-4 bg-yellow-50">
          <p className="text-xs text-yellow-600">Vektet verdi ({statusConfig.probability}%)</p>
          <p className="text-xl font-bold">{fmt(weightedValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kontakt */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="font-semibold">Kontakt</h2>
            {!editingContact ? (
              <button onClick={() => setEditingContact(true)} className="text-blue-600 text-sm flex items-center"><PencilIcon className="w-4 h-4 mr-1"/>Rediger</button>
            ) : (
              <div className="flex gap-1">
                <button onClick={saveContact} className="text-green-600"><CheckIcon className="w-5 h-5"/></button>
                <button onClick={() => { setEditingContact(false); setContactForm(prospect); }} className="text-red-600"><XMarkIcon className="w-5 h-5"/></button>
              </div>
            )}
          </div>
          <div className="card-body space-y-2 text-sm">
            {editingContact ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-500">Fornavn</label><input className="form-input text-sm" value={contactForm.firstName||''} onChange={e=>setContactForm({...contactForm,firstName:e.target.value})}/></div>
                  <div><label className="text-xs text-gray-500">Etternavn</label><input className="form-input text-sm" value={contactForm.lastName||''} onChange={e=>setContactForm({...contactForm,lastName:e.target.value})}/></div>
                </div>
                <div><label className="text-xs text-gray-500">E-post</label><input className="form-input text-sm" value={contactForm.email||''} onChange={e=>setContactForm({...contactForm,email:e.target.value})}/></div>
                <div><label className="text-xs text-gray-500">Telefon</label><input className="form-input text-sm" value={contactForm.phone||''} onChange={e=>setContactForm({...contactForm,phone:e.target.value})}/></div>
                <div><label className="text-xs text-gray-500">Telefon 2</label><input className="form-input text-sm" value={contactForm.phone2||''} onChange={e=>setContactForm({...contactForm,phone2:e.target.value})}/></div>
                <div><label className="text-xs text-gray-500">Adresse</label><input className="form-input text-sm" value={contactForm.address||''} onChange={e=>setContactForm({...contactForm,address:e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-500">Postnr</label><input className="form-input text-sm" value={contactForm.postalCode||''} onChange={e=>setContactForm({...contactForm,postalCode:e.target.value})}/></div>
                  <div><label className="text-xs text-gray-500">Sted</label><input className="form-input text-sm" value={contactForm.city||''} onChange={e=>setContactForm({...contactForm,city:e.target.value})}/></div>
                </div>
              </>
            ) : (
              <>
                <div><span className="text-gray-500">E-post:</span> {prospect.email || '-'}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-500">Telefon:</span>
                  {prospect.phone ? (
                    <>
                      <a href={makeTelHref(normalizeToE164(prospect.phone))} className="text-blue-600 hover:underline">{formatPhoneDisplay(prospect.phone)}</a>
                      <button 
                        onClick={() => handleCall(prospect.phone)}
                        className={`btn btn-xs ${calledRecently ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
                      >
                        Ring
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(normalizeToE164(prospect.phone))} className="btn btn-xs">Kopier</button>
                      {prospect.lastCalledAt && <span className="text-xs text-gray-400">{formatLastCalled(prospect.lastCalledAt)}</span>}
                    </>
                  ) : '-'}
                </div>
                {prospect.phone2 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-500">Telefon 2:</span>
                    <a href={makeTelHref(normalizeToE164(prospect.phone2))} className="text-blue-600 hover:underline">{formatPhoneDisplay(prospect.phone2)}</a>
                    <button 
                      onClick={() => handleCall(prospect.phone2)}
                      className={`btn btn-xs ${calledRecently ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
                    >
                      Ring
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(normalizeToE164(prospect.phone2))} className="btn btn-xs">Kopier</button>
                  </div>
                )}
                <div><span className="text-gray-500">Adresse:</span> {prospect.address ? `${prospect.address}, ${prospect.postalCode} ${prospect.city}` : '-'}</div>
              </>
            )}
          </div>
        </div>

        {/* Selskaper */}
        <div className="card">
          <div className="card-header"><h2 className="font-semibold">Selskaper</h2></div>
          <div className="card-body space-y-3">
            {prospect.companies.map(c => (
              <div key={c.id} className="p-3 bg-gray-50 rounded text-sm">
                {editingCompany === c.id ? (
                  <div className="space-y-2">
                    <input className="form-input text-sm" placeholder="Selskapsnavn" value={companyForm.companyName||''} onChange={e=>setCompanyForm({...companyForm,companyName:e.target.value})}/>
                    <input className="form-input text-sm" placeholder="Org.nr" value={companyForm.orgNumber||''} onChange={e=>setCompanyForm({...companyForm,orgNumber:e.target.value})}/>
                    <input className="form-input text-sm" placeholder="Rolle" value={companyForm.role||''} onChange={e=>setCompanyForm({...companyForm,role:e.target.value})}/>
                    <input className="form-input text-sm" type="number" placeholder="Aksjekapital" value={companyForm.shareCapitalPaid||''} onChange={e=>setCompanyForm({...companyForm,shareCapitalPaid:parseFloat(e.target.value)||null})}/>
                    <input className="form-input text-sm" type="date" value={companyForm.deletedDate?.split('T')[0]||''} onChange={e=>setCompanyForm({...companyForm,deletedDate:e.target.value})}/>
                    <input className="form-input text-sm" placeholder="Slettegrunn" value={companyForm.deletionReason||''} onChange={e=>setCompanyForm({...companyForm,deletionReason:e.target.value})}/>
                    <input className="form-input text-sm" placeholder="Brønnøysund URL" value={companyForm.brrregUrl||''} onChange={e=>setCompanyForm({...companyForm,brrregUrl:e.target.value})}/>
                    <div className="flex gap-1">
                      <button onClick={() => saveCompany(c.id)} className="btn btn-primary btn-sm">Lagre</button>
                      <button onClick={() => setEditingCompany(null)} className="btn btn-secondary btn-sm">Avbryt</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <p className="font-medium">{c.companyName}</p>
                      <button onClick={() => { setEditingCompany(c.id); setCompanyForm(c); }} className="text-blue-600"><PencilIcon className="w-4 h-4"/></button>
                    </div>
                    <p className="text-gray-500">Org: {c.orgNumber}</p>
                    {c.role && <p className="text-gray-500">Rolle: {c.role}</p>}
                    <p className="text-green-600 font-medium">{fmt(Number(c.shareCapitalPaid) || 0)}</p>
                    {c.deletedDate && <p className="text-red-600 text-xs">⚠️ Slettet {fmtDate(c.deletedDate)} - {c.deletionReason}</p>}
                    {c.brrregUrl && <a href={c.brrregUrl} target="_blank" className="text-blue-500 text-xs hover:underline">Brønnøysund →</a>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Oppgaver */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="font-semibold">Oppgaver</h2>
            <button onClick={() => setShowTaskForm(!showTaskForm)} className="text-blue-600 text-sm"><PlusIcon className="w-4 h-4 inline"/>Ny</button>
          </div>
          <div className="card-body space-y-2">
            {showTaskForm && (
              <div className="p-3 bg-yellow-50 rounded space-y-2">
                <input placeholder="Oppgave (f.eks. Ring tilbake)" value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} className="form-input text-sm"/>
                <input type="datetime-local" value={newTask.dueDate} onChange={e=>setNewTask({...newTask,dueDate:e.target.value})} className="form-input text-sm"/>
                <button onClick={addTask} className="btn btn-primary btn-sm w-full">Legg til oppgave</button>
              </div>
            )}
            {(!prospect.tasks || prospect.tasks.length === 0) ? <p className="text-gray-500 text-sm">Ingen oppgaver</p> : prospect.tasks.map(t => (
              <div key={t.id} className={`flex items-center gap-2 p-2 rounded ${t.completed ? 'bg-green-50' : new Date(t.dueDate) < new Date() ? 'bg-red-50' : 'bg-gray-50'}`}>
                <button onClick={() => toggleTask(t.id, !t.completed)} className={`w-5 h-5 rounded border flex items-center justify-center ${t.completed ? 'bg-green-500 text-white' : 'border-gray-300'}`}>
                  {t.completed && <CheckIcon className="w-3 h-3"/>}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${t.completed ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                  <p className={`text-xs ${new Date(t.dueDate) < new Date() && !t.completed ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                    {fmtDateTime(t.dueDate)}
                    {new Date(t.dueDate) < new Date() && !t.completed && ' ⚠️ Forfalt'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notater */}
      <div className="card">
        <div className="card-header"><h2 className="font-semibold">Notater</h2></div>
        <div className="card-body space-y-4">
          <div className="flex gap-2">
            <textarea className="form-input flex-1" rows={2} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Skriv nytt notat..."/>
            <button onClick={addNote} className="btn btn-primary self-end">Lagre notat</button>
          </div>
          {notes.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              {notes.map(n => (
                <div key={n.id} className="p-3 bg-gray-50 rounded flex justify-between">
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{fmtDateTime(n.createdAt)}</p>
                  </div>
                  <button onClick={() => deleteNote(n.id)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
