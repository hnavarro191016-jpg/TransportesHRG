import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Wrench } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const COLUMNS = [
  { id: 'pending', label: 'Pendientes', color: '#d97706', Icon: Clock3 },
  { id: 'en_proceso', label: 'En reparación', color: '#2563eb', Icon: Wrench },
  { id: 'terminada', label: 'Resueltos', color: '#059669', Icon: CheckCircle2 }
];

export const MantenimientoDashboard = ({ setCurrentView }) => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const load = async () => {
      const { data, error: loadError } = await supabase.from('romo_work_orders').select('*').order('open_date', { ascending: false });
      if (loadError) setError(loadError.message); else setTickets(data || []);
    };
    load();
    const channel = supabase.channel('work-orders-dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'romo_work_orders' }, load).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('ticketId', id);
  };

  const handleDrop = async (e, newStatus) => {
    const id = e.dataTransfer.getData('ticketId');
    if (!id) return;
    
    // Update local state for immediate feedback
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    if (!isSupabaseConfigured()) return;
    
    const updateData = { status: newStatus };
    if (newStatus === 'terminada') {
      updateData.close_date = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase.from('romo_work_orders').update(updateData).eq('id', id);
    if (updateError) {
      setError(updateError.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const urgentesCount = tickets.filter((item) => item.issue_description?.includes('Prioridad: alta') && item.status !== 'terminada').length;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 6 }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard del taller</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>Gestión de órdenes de trabajo (Kanban)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCurrentView && setCurrentView('report_incident')}><Wrench size={16} /> Reportar incidencia</button>
      </div>
      
      {error && <div className="badge-danger" style={{ display: 'block', padding: 12, marginBottom: 16 }}>{error}</div>}
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, overflowX: 'auto', paddingBottom: 12 }}>
        {COLUMNS.map(({ id, label, color, Icon }) => {
          // Aceptamos también los estados anteriores por si hay tickets viejos
          const colTickets = tickets.filter(t => (t.status === id) || (id === 'pending' && (t.status === 'reported' || !t.status)) || (id === 'en_proceso' && ['assigned', 'in_progress'].includes(t.status)) || (id === 'terminada' && ['resolved', 'closed'].includes(t.status)));
          
          return (
            <div 
              key={id} 
              onDrop={(e) => handleDrop(e, id)} 
              onDragOver={handleDragOver}
              style={{ flex: 1, minWidth: 300, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', borderTop: `4px solid ${color}`, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }}>
                <Icon color={color} size={18} /> {label} ({colTickets.length})
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 400, flex: 1, background: 'var(--bg-body)' }}>
                {colTickets.map(ticket => (
                  <article 
                    key={ticket.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    className="content-card" 
                    style={{ padding: 16, cursor: 'grab', borderLeft: `4px solid ${ticket.issue_description?.includes('Prioridad: alta') ? '#dc2626' : 'var(--color-border)'}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong>{ticket.folio || ticket.ticket_number}</strong>
                      <span className="badge badge-info">{ticket.economic_number}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{ticket.issue_description || ticket.description}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 8 }}>{new Date(ticket.open_date || ticket.reported_at || new Date()).toLocaleString('es-MX')}</div>
                  </article>
                ))}
                {colTickets.length === 0 && <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '24px 0', fontSize: '0.9rem' }}>Arrastra tickets aquí</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
