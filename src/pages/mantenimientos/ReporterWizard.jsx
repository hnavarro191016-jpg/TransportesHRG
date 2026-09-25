import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, ClipboardList, MessageCircle, Paperclip, PlusCircle, Truck, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const CATEGORIES = [
  ['mecanica', 'Falla mecánica', Wrench, '#f59e0b'],
  ['llantas', 'Llantas o ponchadura', AlertTriangle, '#ef4444'],
  ['electrica', 'Falla eléctrica', AlertTriangle, '#8b5cf6'],
  ['seguridad', 'Situación de seguridad', AlertTriangle, '#dc2626'],
  ['revision', 'Revisión programada', CheckCircle2, '#10b981']
];
const STATUS = { reported: 'Reportado', assigned: 'Asignado', in_progress: 'En reparación', resolved: 'Resuelto', closed: 'Cerrado' };

export const ReporterWizard = () => {
  const { activeUser, data, addToast } = useApp();
  const [tab, setTab] = useState('report');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ unitId: '', category: '', tirePosition: '', canContinue: '', description: '', priority: 'media' });
  const [tickets, setTickets] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const unit = useMemo(() => data.units.find((item) => item.id === form.unitId), [data.units, form.unitId]);

  const loadTickets = async () => {
    if (!isSupabaseConfigured() || !activeUser?.id) return;
    const { data: result, error: resultError } = await supabase.from('romo_work_orders').select('*').order('open_date', { ascending: false });
    if (resultError) setError(resultError.message); else setTickets(result || []);
  };
  useEffect(() => { if (tab === 'tickets') loadTickets(); }, [tab]);
  const isTireReport = form.category === 'llantas';
  const detailStep = isTireReport ? 4 : 2;
  const priorityStep = isTireReport ? 5 : 3;
  const reviewStep = isTireReport ? 6 : 4;
  const next = () => {
    if ((step === 0 && !unit) || (step === 2 && isTireReport && !form.tirePosition) || (step === 3 && isTireReport && !form.canContinue) || (step === detailStep && !form.description.trim())) return;
    setStep(step + 1);
  };
  const submit = async () => {
    if (!isSupabaseConfigured()) { setError('Configura Supabase y aplica la migración de mantenimiento.'); return; }
    setSaving(true); setError('');
    const completeDescription = isTireReport
      ? `Neumático dañado. Posición: ${form.tirePosition}. Puede continuar: ${form.canContinue}. Detalle: ${form.description.trim()} (Prioridad: ${form.priority})`
      : `${form.description.trim()} (Prioridad: ${form.priority})`;
    
    const newId = crypto.randomUUID();
    const newFolio = `WO-${Date.now().toString().slice(-6)}`;
    
    const { data: ticket, error: saveError } = await supabase.from('romo_work_orders').insert([{
      id: newId,
      folio: newFolio,
      unit_id: unit.id,
      economic_number: unit.economicNumber,
      unit_info: `${unit.brand} ${unit.model}`,
      maintenance_type: form.category,
      issue_description: completeDescription,
      status: 'pending',
      open_date: new Date().toISOString()
    }]).select().single();
    
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    
    // Si la BD no retorna el registro en el select() por RLS u otra cosa, usamos newId para los attachments
    const currentTicketId = ticket?.id || newId;
    
    if (attachments.length && currentTicketId) {
      for (const file of attachments) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${currentTicketId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('maintenance_evidence').upload(storagePath, file);
        if (uploadError) { setError(`El ticket se creó, pero no se pudo adjuntar ${file.name}: ${uploadError.message}`); continue; }
        
        const { error: attachmentError } = await supabase.from('romo_maintenance_attachments').insert({ 
          ticket_id: currentTicketId, 
          storage_path: storagePath, 
          file_name: file.name, 
          mime_type: file.type || null, 
          byte_size: file.size 
        });
        if (attachmentError) setError(`El ticket se creó, pero no se registró ${file.name}: ${attachmentError.message}`);
      }
    }
    addToast(`Reporte ${ticket?.folio || newFolio} enviado al taller.`, 'success');
    setForm({ unitId: '', category: '', tirePosition: '', canContinue: '', description: '', priority: 'media' }); setAttachments([]); setStep(0); setTab('tickets');
  };
  const prompt = [
    `Hola, ${activeUser?.name || 'operador'}. ¿Qué unidad presenta el problema?`,
    `Perfecto, ${unit?.economicNumber}. ¿Qué tipo de situación deseas reportar?`,
    isTireReport ? '¿En qué posición está el neumático dañado?' : 'Cuéntame qué sucede. Incluye síntomas, ubicación o desde cuándo empezó.',
    isTireReport ? '¿La unidad puede continuar circulando de forma segura?' : '¿Qué tan urgente es atenderla?',
    isTireReport ? 'Describe el daño: ponchadura, desgaste, corte, desprendimiento u otra condición.' : 'Revisa el reporte antes de enviarlo al taller.',
    isTireReport ? '¿Qué tan urgente es atenderla?' : '',
    isTireReport ? 'Revisa el reporte antes de enviarlo al taller.' : ''
  ][step];
  return <div style={{ maxWidth: 760, margin: '24px auto' }}><div className="content-card" style={{ overflow: 'hidden', borderRadius: 20 }}>
    <header style={{ background: 'linear-gradient(135deg, #123a63, #0f766e)', color: 'white', padding: '24px 28px' }}><strong><MessageCircle size={23} style={{ verticalAlign: 'middle', marginRight: 9 }} />Asistente de mantenimiento</strong><p style={{ margin: '8px 0 0', opacity: .9 }}>Reporte directo en Portal Empresarial · sin Telegram</p></header>
    <nav style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>{[['report', 'Nuevo reporte', PlusCircle], ['tickets', 'Mis reportes', ClipboardList]].map(([id, text, Icon]) => <button key={id} onClick={() => { setTab(id); setError(''); }} style={{ flex: 1, padding: 14, border: 'none', borderBottom: tab === id ? '3px solid var(--color-primary)' : '3px solid transparent', background: 'transparent', color: tab === id ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer' }}><Icon size={17} style={{ verticalAlign: 'middle', marginRight: 7 }} />{text}</button>)}</nav>
    {tab === 'tickets' ? <section style={{ padding: 28 }}>{tickets.length ? <div style={{ display: 'grid', gap: 12 }}>{tickets.map((ticket) => <article key={ticket.id} className="content-card" style={{ padding: 16, borderLeft: `4px solid ${ticket.issue_description?.includes('Prioridad: alta') ? '#dc2626' : '#d97706'}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{ticket.folio} · {ticket.economic_number}</strong><span className="badge badge-info">{STATUS[ticket.status] || ticket.status}</span></div><p style={{ margin: '10px 0 4px' }}>{ticket.issue_description}</p><small style={{ color: 'var(--color-text-muted)' }}>{new Date(ticket.open_date).toLocaleString('es-MX')}</small></article>)}</div> : <div className="empty-state"><ClipboardList className="empty-icon" /><p>Aún no tienes reportes registrados.</p></div>}</section> : <section style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}><div style={{ background: '#e0f2fe', color: '#0369a1', padding: 10, borderRadius: 14 }}><MessageCircle size={22} /></div><div style={{ background: 'var(--bg-card-hover)', padding: '12px 16px', borderRadius: '4px 16px 16px', fontWeight: 600 }}>{prompt}</div></div>
      {error && <div className="badge-danger" style={{ display: 'block', padding: 12, marginBottom: 16 }}>{error}</div>}
      {step === 0 && <div className="form-group"><label className="form-label">Unidad</label><select className="form-control" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}><option value="">Selecciona una unidad</option>{data.units.filter((item) => item.status !== 'inactivo').map((item) => <option key={item.id} value={item.id}>{item.economicNumber} · {item.brand} {item.model}</option>)}</select></div>}
      {step === 1 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>{CATEGORIES.map(([id, label, Icon, color]) => <button key={id} onClick={() => { setForm({ ...form, category: id }); setStep(2); }} style={{ padding: 18, textAlign: 'left', cursor: 'pointer', background: 'var(--bg-surface)', border: `1px solid ${form.category === id ? color : 'var(--color-border)'}`, borderRadius: 12, color: 'var(--color-text-main)' }}><Icon color={color} size={22} /><div style={{ fontWeight: 700, marginTop: 8 }}>{label}</div></button>)}</div>}
      {step === 2 && isTireReport && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>{['Delantera izquierda', 'Delantera derecha', 'Trasera izquierda', 'Trasera derecha', 'Refacción', 'No estoy seguro'].map((position) => <button key={position} onClick={() => setForm({ ...form, tirePosition: position })} style={{ padding: 13, borderRadius: 10, border: `2px solid ${form.tirePosition === position ? '#dc2626' : 'var(--color-border)'}`, background: 'transparent', color: 'var(--color-text-main)', cursor: 'pointer' }}>{position}</button>)}</div>}
      {step === 3 && isTireReport && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>{['Sí, con precaución', 'No, requiere atención inmediata'].map((answer) => <button key={answer} onClick={() => setForm({ ...form, canContinue: answer })} style={{ padding: 16, borderRadius: 10, border: `2px solid ${form.canContinue === answer ? '#dc2626' : 'var(--color-border)'}`, background: 'transparent', color: 'var(--color-text-main)', fontWeight: 700, cursor: 'pointer' }}>{answer}</button>)}</div>}
      {step === detailStep && <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-control" rows={5} value={form.description} placeholder={isTireReport ? 'Ej.: la llanta tiene un corte lateral y pierde presión.' : 'Ej.: La unidad pierde potencia al subir pendientes desde hace 30 minutos.'} onChange={(e) => setForm({ ...form, description: e.target.value })} /><label className="form-label" style={{ marginTop: 14 }}><Paperclip size={15} style={{ verticalAlign: 'middle' }} /> Evidencia opcional (foto o PDF, máximo 5 archivos)</label><input className="form-control" type="file" accept="image/*,.pdf" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []).slice(0, 5))} />{attachments.length > 0 && <small style={{ color: 'var(--color-text-muted)' }}>{attachments.length} archivo(s) listo(s) para adjuntar.</small>}</div>}
      {step === priorityStep && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>{['baja', 'media', 'alta'].map((priority) => <button key={priority} onClick={() => setForm({ ...form, priority })} style={{ padding: 14, borderRadius: 10, border: `2px solid ${form.priority === priority ? '#d97706' : 'var(--color-border)'}`, background: 'transparent', color: 'var(--color-text-main)', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{priority}</button>)}</div>}
      {step === reviewStep && <div className="content-card" style={{ padding: 18 }}><strong><Truck size={17} style={{ verticalAlign: 'middle' }} /> {unit?.economicNumber}</strong>{isTireReport && <p style={{ margin: '10px 0 0' }}>Neumático: {form.tirePosition} · Circulación: {form.canContinue}</p>}<p style={{ margin: '10px 0' }}>{form.description}</p><span className="badge badge-warning">{form.category}</span> <span className="badge badge-danger">Prioridad {form.priority}</span></div>}
      <footer style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}><button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Atrás</button>{step < reviewStep ? <button className="btn btn-primary" onClick={next}>Continuar <ChevronRight size={16} /></button> : <button className="btn btn-primary" disabled={saving} onClick={submit}>{saving ? 'Enviando…' : 'Enviar al taller'}</button>}</footer>
    </section>}
  </div></div>;
};
