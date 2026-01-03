'use client';
import { useState, useEffect } from 'react';
import { 
  PaperAirplaneIcon, 
  InboxIcon as InboxIconOutline,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TicketMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  fromEmail: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  prospect?: { firstName: string; lastName: string; email: string };
  messages: TicketMessage[];
}

export default function Inbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');
  const [newEmail, setNewEmail] = useState({ to: '', subject: '', body: '', bcc: '' });
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newEmail.to,
          subject: newEmail.subject,
          body: newEmail.body,
          bcc: newEmail.bcc
        })
      });
      
      if (response.ok) {
        setShowCompose(false);
        setNewEmail({ to: '', subject: '', body: '', bcc: '' });
        fetchTickets();
      } else {
        const error = await response.json();
        alert('Feil: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Kunne ikke sende e-post');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    
    setSending(true);
    try {
      const toEmail = selectedTicket.messages[0]?.direction === 'INBOUND' 
        ? selectedTicket.messages[0].fromEmail 
        : selectedTicket.messages[0].toEmail;
      
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: `Re: ${selectedTicket.subject}`,
          body: replyText,
          ticketId: selectedTicket.id
        })
      });
      
      if (response.ok) {
        setReplyText('');
        setReplyMode(false);
        fetchTickets();
        // Oppdater valgt ticket
        const updatedResponse = await fetch(`/api/tickets/${selectedTicket.id}`);
        if (updatedResponse.ok) {
          setSelectedTicket(await updatedResponse.json());
        }
      } else {
        const error = await response.json();
        alert('Feil: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: status as Ticket['status'] });
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'OPEN') return t.status !== 'CLOSED';
    if (filter === 'CLOSED') return t.status === 'CLOSED';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Åpen';
      case 'PENDING': return 'Venter';
      case 'RESOLVED': return 'Løst';
      case 'CLOSED': return 'Lukket';
      default: return status;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kundeservice</h1>
          <p className="text-gray-500">{filteredTickets.length} saker</p>
        </div>
        <div className="flex space-x-3">
          <select 
            className="form-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'ALL' | 'OPEN' | 'CLOSED')}
          >
            <option value="OPEN">Åpne saker</option>
            <option value="CLOSED">Lukkede saker</option>
            <option value="ALL">Alle saker</option>
          </select>
          <button 
            onClick={() => setShowCompose(true)}
            className="btn btn-primary"
          >
            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            Ny e-post
          </button>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ny e-post (oppretter ny sak)</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="form-label">Til</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="mottaker@epost.no"
                  value={newEmail.to}
                  onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">BCC (blindkopi)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="kopi@epost.no"
                  value={newEmail.bcc}
                  onChange={(e) => setNewEmail({...newEmail, bcc: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Emne</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Emne..."
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Melding</label>
                <textarea
                  className="form-input"
                  rows={8}
                  placeholder="Skriv din melding..."
                  value={newEmail.body}
                  onChange={(e) => setNewEmail({...newEmail, body: e.target.value})}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <button onClick={() => setShowCompose(false)} className="btn btn-secondary">Avbryt</button>
              <button onClick={handleSendEmail} disabled={sending} className="btn btn-primary">
                {sending ? 'Sender...' : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket-liste */}
        <div className="lg:col-span-1 card">
          <div className="card-header">
            <h2 className="font-semibold">Saker</h2>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <InboxIconOutline className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Ingen saker</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setReplyMode(false); }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-dtax-primary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{ticket.subject}</p>
                  {ticket.prospect && (
                    <p className="text-xs text-gray-500">{ticket.prospect.firstName} {ticket.prospect.lastName}</p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">
                      {ticket.messages.length} melding{ticket.messages.length !== 1 ? 'er' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ticket.updatedAt).toLocaleDateString('nb-NO')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket-visning */}
        <div className="lg:col-span-2 card">
          {selectedTicket ? (
            <>
              <div className="card-header flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{selectedTicket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusLabel(selectedTicket.status)}
                    </span>
                  </div>
                  <h2 className="font-semibold">{selectedTicket.subject}</h2>
                  {selectedTicket.prospect && (
                    <p className="text-sm text-gray-500">
                      {selectedTicket.prospect.firstName} {selectedTicket.prospect.lastName} 
                      <span className="text-gray-400 ml-2">{selectedTicket.prospect.email}</span>
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {selectedTicket.status !== 'CLOSED' && (
                    <button 
                      onClick={() => handleStatusChange(selectedTicket.id, 'CLOSED')}
                      className="btn btn-secondary text-sm"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Lukk sak
                    </button>
                  )}
                  {selectedTicket.status === 'CLOSED' && (
                    <button 
                      onClick={() => handleStatusChange(selectedTicket.id, 'OPEN')}
                      className="btn btn-secondary text-sm"
                    >
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Gjenåpne
                    </button>
                  )}
                </div>
              </div>
              
              {/* Meldinger */}
              <div className="card-body space-y-4 max-h-[400px] overflow-y-auto">
                {selectedTicket.messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-4 rounded-lg ${msg.direction === 'OUTBOUND' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-medium">
                          {msg.direction === 'OUTBOUND' ? 'Sendt til: ' : 'Fra: '}
                        </span>
                        <span className="text-sm text-gray-600">
                          {msg.direction === 'OUTBOUND' ? msg.toEmail : msg.fromEmail}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleString('nb-NO')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.bodyText}</p>
                  </div>
                ))}
              </div>
              
              {/* Svar-felt */}
              {selectedTicket.status !== 'CLOSED' && (
                <div className="p-4 border-t">
                  {replyMode ? (
                    <div className="space-y-3">
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Skriv ditt svar..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => setReplyMode(false)} className="btn btn-secondary">Avbryt</button>
                        <button onClick={handleReply} disabled={sending} className="btn btn-primary">
                          {sending ? 'Sender...' : 'Send svar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReplyMode(true)} className="btn btn-primary w-full">
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                      Svar på denne saken
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Velg en sak for å se detaljer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
