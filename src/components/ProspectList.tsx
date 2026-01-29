'use client';
import { normalizeToE164, makeTelHref, formatPhoneDisplay, wasCalledRecently, formatLastCalled } from '@/lib/phone';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, PlusIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import AddProspectModal from './AddProspectModal';

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  lastCalledAt: string | null;
  companies: { companyName: string; orgNumber: string; shareCapitalPaid: number; deletedDate: string }[];
  createdAt: string;
}

interface ProspectListProps {
  onViewProspect: (id: string) => void;
}

type SortKey = 'name' | 'company' | 'orgNumber' | 'deletedDate' | 'shareCapital' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function ProspectList({ onViewProspect }: ProspectListProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [step, setStep] = useState<'upload'|'map'|'done'>('upload');
  const [fileData, setFileData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const fileRef = useRef<HTMLInputElement>(null);

  const targetFields = [
    { key: 'name', label: 'Navn (fullt)' },
    { key: 'firstName', label: 'Fornavn' },
    { key: 'lastName', label: 'Etternavn' },
    { key: 'email', label: 'E-post' },
    { key: 'phone', label: 'Telefon' },
    { key: 'phone2', label: 'Telefon 2' },
    { key: 'address', label: 'Adresse' },
    { key: 'postalCode', label: 'Postnr' },
    { key: 'city', label: 'Poststed' },
    { key: 'company', label: 'Selskap' },
    { key: 'orgNumber', label: 'Org.nr' },
    { key: 'role', label: 'Rolle' },
    { key: 'shareCapital', label: 'Aksjekapital' },
    { key: 'deletedDate', label: 'Slettedato' },
    { key: 'deletionReason', label: 'Slettegrunn' },
    { key: 'brrregUrl', label: 'Brønnøysund URL' },
  ];

  useEffect(() => { fetchProspects(); }, []);

  const fetchProspects = async () => {
    try {
      const res = await fetch('/api/prospects');
      if (res.ok) setProspects(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCall = async (e: React.MouseEvent, prospectId: string, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return;
    try {
      await fetch(`/api/prospects/${prospectId}/call`, { method: 'POST' });
      fetchProspects();
    } catch (err) { console.error('Failed to update call status:', err); }
    window.location.href = makeTelHref(normalizeToE164(phone));
  };

  const handleExport = () => {
    const headers = ['Navn', 'E-post', 'Telefon', 'Selskap', 'Org.nr', 'Aksjekapital', 'Slettet', 'Status', 'Opprettet'];
    const rows = filteredAndSortedProspects.map(p => [
      `${p.firstName} ${p.lastName}`,
      p.email || '',
      p.phone || '',
      p.companies?.[0]?.companyName || '',
      p.companies?.[0]?.orgNumber || '',
      p.companies?.[0]?.shareCapitalPaid || '',
      p.companies?.[0]?.deletedDate ? new Date(p.companies[0].deletedDate).toLocaleDateString('nb-NO') : '',
      p.status,
      new Date(p.createdAt).toLocaleDateString('nb-NO')
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="text-gray-300 ml-1">⇅</span>;
    return sortDir === 'asc' ? <ChevronUpIcon className="w-4 h-4 inline ml-1"/> : <ChevronDownIcon className="w-4 h-4 inline ml-1"/>;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/prospects/preview', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setColumns(data.columns);
        setFileData(data.rows);
        autoMap(data.columns);
        setStep('map');
      } else setImportMsg(`✗ ${data.error}`);
    } catch (err) { setImportMsg('✗ Kunne ikke lese fil'); }
  };

  const autoMap = (cols: string[]) => {
    const m: Record<string,string> = {};
    cols.forEach(c => {
      const cl = c.toLowerCase().replace(/[_-]/g, '');
      if (cl.includes('kontaktperson') || cl === 'navn') m['name'] = c;
      else if (cl === 'fornavn') m['firstName'] = c;
      else if (cl === 'etternavn') m['lastName'] = c;
      else if (cl.includes('epost') || cl === 'email') m['email'] = c;
      else if (cl === 'telefon' || cl === 'tlf1' || cl === 'phone') m['phone'] = c;
      else if (cl === 'telefon2' || cl === 'tlf2') m['phone2'] = c;
      else if (cl.includes('selskap') || cl.includes('firma')) m['company'] = c;
      else if (cl.includes('orgnr')) m['orgNumber'] = c;
      else if (cl === 'adresse' || cl === 'adr') m['address'] = c;
      else if (cl === 'postnr' || cl === 'pnr') m['postalCode'] = c;
      else if (cl === 'poststed' || cl === 'sted') m['city'] = c;
      else if (cl.includes('rolle')) m['role'] = c;
      else if (cl.includes('aksjekapital') || cl.includes('aksjekap')) m['shareCapital'] = c;
      else if (cl.includes('slettedato') || cl === 'dato1') m['deletedDate'] = c;
      else if (cl.includes('slettegrunn')) m['deletionReason'] = c;
      else if (cl.includes('url') || cl.includes('brreg')) m['brrregUrl'] = c;
    });
    setMapping(m);
  };

  const handleImport = async () => {
    if (!mapping.name && !mapping.firstName) { setImportMsg('✗ Velg minst Navn eller Fornavn'); return; }
    setImporting(true);
    try {
      const res = await fetch('/api/prospects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: fileData, mapping })
      });
      const data = await res.json();
      if (res.ok) { setImportMsg(`✓ Importerte ${data.imported} av ${data.total}`); setStep('done'); fetchProspects(); }
      else setImportMsg(`✗ ${data.error}`);
    } catch (err) { setImportMsg('✗ Import feilet'); }
    finally { setImporting(false); }
  };

  const resetImport = () => { setShowImport(false); setStep('upload'); setFileData([]); setColumns([]); setMapping({}); setImportMsg(''); };

  const getDeletedYear = (d: string) => d ? new Date(d).getFullYear() : null;
  const years = [...new Set(prospects.flatMap(p => p.companies.map(c => getDeletedYear(c.deletedDate))).filter(Boolean))].sort().reverse();

  const filteredProspects = prospects.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName} ${p.email} ${p.phone} ${p.companies?.[0]?.companyName || ''} ${p.companies?.[0]?.orgNumber || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesYear = yearFilter === 'ALL' || p.companies.some(c => getDeletedYear(c.deletedDate)?.toString() === yearFilter);
    return matchesSearch && matchesStatus && matchesYear;
  });

  const filteredAndSortedProspects = [...filteredProspects].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'nb');
        break;
      case 'company':
        cmp = (a.companies?.[0]?.companyName || '').localeCompare(b.companies?.[0]?.companyName || '', 'nb');
        break;
      case 'orgNumber':
        cmp = (a.companies?.[0]?.orgNumber || '').localeCompare(b.companies?.[0]?.orgNumber || '');
        break;
      case 'deletedDate':
        const dateA = a.companies?.[0]?.deletedDate ? new Date(a.companies[0].deletedDate).getTime() : 0;
        const dateB = b.companies?.[0]?.deletedDate ? new Date(b.companies[0].deletedDate).getTime() : 0;
        cmp = dateA - dateB;
        break;
      case 'shareCapital':
        cmp = (Number(a.companies?.[0]?.shareCapitalPaid) || 0) - (Number(b.companies?.[0]?.shareCapitalPaid) || 0);
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const getStatusBadge = (s: string) => ({ NEW:'bg-blue-100 text-blue-800', CONTACTED:'bg-yellow-100 text-yellow-800', IN_PROGRESS:'bg-indigo-100 text-indigo-800', CONVERTED:'bg-green-100 text-green-800', LOST:'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-800');
  const fmt = (n: number) => new Intl.NumberFormat('nb-NO',{style:'currency',currency:'NOK',maximumFractionDigits:0}).format(n);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Prospekter</h1><p className="text-gray-500">{prospects.length} totalt, {filteredAndSortedProspects.length} vist</p></div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center"><ArrowDownTrayIcon className="w-5 h-5 mr-2"/>Eksporter</button>
          <button onClick={() => setShowImport(true)} className="btn btn-secondary flex items-center"><ArrowUpTrayIcon className="w-5 h-5 mr-2"/>Importer</button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center"><PlusIcon className="w-5 h-5 mr-2"/>Legg til</button>
        </div>
      </div>

      {showImport && (
        <div className="card p-6 border shadow-lg">
          <div className="flex justify-between mb-4"><h2 className="font-semibold">Importer</h2><button onClick={resetImport}><XMarkIcon className="w-5 h-5"/></button></div>
          {step === 'upload' && <div className="border-2 border-dashed rounded p-8 text-center"><input ref={fileRef} type="file" accept=".xlsx,.csv" onChange={handleFileSelect} className="hidden"/><button onClick={() => fileRef.current?.click()} className="btn btn-primary">Velg fil</button></div>}
          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Fant {fileData.length} rader. Koble kolonner:</p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">{targetFields.map(f => (
                <div key={f.key} className="flex items-center gap-2"><label className="w-32 text-sm">{f.label}:</label><select value={mapping[f.key]||''} onChange={e=>setMapping({...mapping,[f.key]:e.target.value})} className="form-input flex-1 text-sm py-1"><option value="">--</option>{columns.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              ))}</div>
              <div className="flex gap-2"><button onClick={()=>setStep('upload')} className="btn btn-secondary">Tilbake</button><button onClick={handleImport} disabled={importing} className="btn btn-primary">{importing?'...':'Importer'}</button></div>
            </div>
          )}
          {step === 'done' && <div className="text-center"><p className="text-green-600">{importMsg}</p><button onClick={resetImport} className="btn btn-primary mt-4">Lukk</button></div>}
          {importMsg && step !== 'done' && <p className="mt-2 text-sm text-red-600">{importMsg}</p>}
        </div>
      )}

      <div className="card">
        <div className="card-header flex items-center gap-4">
          <div className="relative flex-1"><MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="text" placeholder="Søk navn, firma, org.nr..." className="form-input pl-10" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <select className="form-input w-40" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="ALL">Alle statuser</option><option value="NEW">Ny</option><option value="CONTACTED">Kontaktet</option><option value="IN_PROGRESS">I prosess</option><option value="CONVERTED">Konvertert</option><option value="LOST">Tapt</option>
          </select>
          <select className="form-input w-40" value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
            <option value="ALL">Alle år</option>{years.map(y=><option key={y || 0} value={y || ""}>{y}</option>)}
          </select>
        </div>
        <div className="table-container">
          {filteredAndSortedProspects.length === 0 ? <div className="text-center py-12 text-gray-500">Ingen prospekter</div> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Navn<SortIcon column="name"/></th>
                  <th>Telefon</th>
                  <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('company')}>Selskap<SortIcon column="company"/></th>
                  <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('orgNumber')}>Org.nr<SortIcon column="orgNumber"/></th>
                  <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('deletedDate')}>Slettet<SortIcon column="deletedDate"/></th>
                  <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('shareCapital')}>Aksjekapital<SortIcon column="shareCapital"/></th>
                  <th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>Status<SortIcon column="status"/></th>
                </tr>
              </thead>
              <tbody>{filteredAndSortedProspects.map(p=>(
                <tr key={p.id} onClick={()=>onViewProspect(p.id)} className="cursor-pointer hover:bg-gray-50">
                  <td className="font-medium">{p.firstName} {p.lastName}</td>
                  <td>
                    {p.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatPhoneDisplay(p.phone)}</span>
                        <button
                          onClick={(e) => handleCall(e, p.id, p.phone)}
                          className={`px-2 py-0.5 text-xs font-medium rounded ${wasCalledRecently(p.lastCalledAt) ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                          title={formatLastCalled(p.lastCalledAt) || 'Klikk for å ringe'}
                        >
                          Ring
                        </button>
                      </div>
                    ) : '-'}
                  </td>
                  <td>{p.companies?.[0]?.companyName||'-'}</td>
                  <td className="text-gray-600 text-sm">{p.companies?.[0]?.orgNumber||'-'}</td>
                  <td>{p.companies?.[0]?.deletedDate ? new Date(p.companies[0].deletedDate).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
                  <td>{p.companies?.[0]?.shareCapitalPaid ? fmt(p.companies[0].shareCapitalPaid) : '-'}</td>
                  <td><span className={`status-badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && <AddProspectModal onClose={() => setShowAdd(false)} onAdded={fetchProspects} />}
    </div>
  );
}
