import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, History, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const LABEL = { reported: 'Pendiente', assigned: 'Asignado', in_progress: 'En reparación', resolved: 'Resuelto', closed: 'Cerrado' };

export const WorkOrdersView = () => {
  const { activeUser, addToast } = useApp();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [solution, setSolution] = useState({});
  const [events, setEvents] = useState({});
  const load = async () => {
    if (!isSupabaseConfigured()) { setError('Configura Supabase y aplica la migración de mantenimiento.'); return; }
    const { data, error: loadError } = await supabase.from('romo_maintenance_tickets').select('*').order('reported_at', { ascending: false });
    if (loadError) setError(loadError.message); else setTickets(data || []);
  };
  useEffect(() => { load(); }, []);
  const loadEvents = async (ticketId) => {
    if (events[ticketId]) { setEvents({ ...events, [ticketId]: null }); return; }
    const { data: result, error: resultError } = await supabase.from('romo_maintenance_events').select('*').eq('ticket_id', ticketId).order('created_at');
    if (resultError) setError(resultError.message); else setEvents({ ...events, [ticketId]: result || [] });
  };
  const take = async (ticket) => {
    const { error: actionError } = await supabase.rpc('take_maintenance_ticket', { p_ticket_id: ticket.id });
    if (actionError) { setError(actionError.message); return; }
    addToast(`Tomaste el ticket ${ticket.ticket_number}.`, 'success'); load();
  };
  const resolve = async (ticket) => {
    const text = solution[ticket.id]?.trim();
    if (!text) { setError('Describe la solución aplicada antes de resolver el ticket.'); return; }
    const { error: actionError } = await supabase.rpc('resolve_maintenance_ticket', { p_ticket_id: ticket.id, p_solution: text });
    if (actionError) { setError(actionError.message); return; }
    addToast(`Ticket ${ticket.ticket_number} marcado como resuelto.`, 'success'); load();
  };
  return <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
    <h1 style={{ margin: 0 }}>Tickets de mantenimiento</h1><p style={{ color: 'var(--color-text-muted)' }}>El taller toma, diagnostica y resuelve los reportes creados por operadores.</p>
    {error && <div className="badge-danger" style={{ display: 'block', padding: 12, marginBottom: 16 }}>{error}</div>}
    <div style={{ display: 'grid', gap: 16 }}>{tickets.map((ticket) => <article key={ticket.id} className="content-card" style={{ padding: 20, borderLeft: `4px solid ${ticket.priority === 'alta' ? '#dc2626' : ticket.priority === 'media' ? '#d97706' : '#059669'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}><div><strong>{ticket.ticket_number} · Unidad {ticket.economic_number}</strong><p style={{ marginBottom: 5 }}>{ticket.description}</p><small style={{ color: 'var(--color-text-muted)' }}>Categoría: {ticket.category} · Reportó: {ticket.reported_by_name || 'Operador'} · {new Date(ticket.reported_at).toLocaleString('es-MX')}</small></div><span className="badge badge-info">{LABEL[ticket.status] || ticket.status}</span></div>
      {ticket.status === 'reported' && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => take(ticket)}><Wrench size={16} /> Tomar ticket</button>}
      {['assigned', 'in_progress'].includes(ticket.status) && <div style={{ marginTop: 16 }}><label className="form-label">Solución / diagnóstico final</label><textarea className="form-control" rows={3} value={solution[ticket.id] || ''} onChange={(event) => setSolution({ ...solution, [ticket.id]: event.target.value })} placeholder="Trabajo realizado, refacciones usadas y observaciones." /><button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => resolve(ticket)}><CheckCircle2 size={16} /> Resolver ticket</button></div>}
      {ticket.status === 'resolved' && <p style={{ marginTop: 14, color: '#059669' }}><Clock3 size={16} style={{ verticalAlign: 'middle' }} /> Solución: {ticket.solution}</p>}
      <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => loadEvents(ticket.id)}><History size={15} /> {events[ticket.id] ? 'Ocultar bitácora' : 'Ver bitácora'}</button>
      {events[ticket.id] && <div style={{ marginTop: 12, paddingLeft: 14, borderLeft: '2px solid var(--color-border)' }}>{events[ticket.id].map((event) => <div key={event.id} style={{ marginBottom: 9, fontSize: '.88rem' }}><strong>{event.actor_name}</strong> · {event.note || event.event_type}<small style={{ display: 'block', color: 'var(--color-text-muted)' }}>{new Date(event.created_at).toLocaleString('es-MX')}</small></div>)}</div>}
    </article>)}{!tickets.length && !error && <div className="empty-state">No hay tickets por atender.</div>}</div>
  </div>;
};
