import React, { useEffect, useMemo, useState } from 'react';
import { Minus, PackageCheck, Plus, Send, Wrench } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export const DespachoView = () => {
  const { data, activeUser, addExit, addToast, formatMXN } = useApp();
  const [tickets, setTickets] = useState([]);
  const [balances, setBalances] = useState([]);
  const [ticketId, setTicketId] = useState('');
  const [warehouse, setWarehouse] = useState(data.warehouses[0]?.name || '');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket.id === ticketId), [tickets, ticketId]);
  const warehouseId = useMemo(() => data.warehouses.find((item) => item.name === warehouse)?.id, [data.warehouses, warehouse]);
  const availableAtWarehouse = (id) => balances.find((balance) => balance.product_id === id && balance.warehouse_id === warehouseId)?.quantity || 0;

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured()) { setError('Configura Supabase y aplica las migraciones de fases 1 y 2.'); return; }
      const [{ data: result, error: loadError }, { data: balanceData, error: balanceError }] = await Promise.all([
        supabase.from('romo_maintenance_tickets').select('*').in('status', ['assigned', 'in_progress']).order('reported_at'),
        supabase.from('romo_inventory_balances').select('*')
      ]);
      if (loadError) setError(loadError.message); else setTickets(result || []);
      if (balanceError) setError(balanceError.message); else setBalances(balanceData || []);
    };
    load();
  }, []);

  const addItem = () => {
    const product = data.products.find((item) => item.id === productId);
    if (!product || Number(quantity) <= 0) return;
    if (Number(quantity) > availableAtWarehouse(product.id)) { setError(`Existencia insuficiente en ${warehouse}. Disponible: ${availableAtWarehouse(product.id)}.`); return; }
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) return current.map((item) => item.productId === product.id ? { ...item, qty: item.qty + Number(quantity) } : item);
      return [...current, { productId: product.id, productCode: product.codeInternal, productName: product.name, qty: Number(quantity), unitCost: Number(product.unitCost) }];
    });
    setQuantity(1); setProductId('');
  };

  const submit = async () => {
    if (!selectedTicket || !warehouse || !items.length) { setError('Selecciona ticket, almacén y al menos una refacción.'); return; }
    setError('');
    const totalCost = items.reduce((total, item) => total + item.qty * item.unitCost, 0);
    const completed = await addExit({
      reason: 'Despacho para mantenimiento', unitId: selectedTicket.unit_id, economicNumber: selectedTicket.economic_number,
      warehouse, responsibleUser: activeUser.name, notes, items, totalCost, maintenanceTicketId: selectedTicket.id
    });
    if (!completed) return;
    addToast(`Refacciones despachadas para ${selectedTicket.ticket_number}.`, 'success');
    setItems([]); setNotes('');
  };

  return <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
    <h1 style={{ margin: 0 }}>Despacho a unidad</h1><p style={{ color: 'var(--color-text-muted)' }}>Entrega refacciones a un ticket activo; el servidor valida el saldo del almacén y registra kardex.</p>
    {error && <div className="badge-danger" style={{ display: 'block', padding: 12, marginBottom: 16 }}>{error}</div>}
    <div className="content-card" style={{ padding: 24 }}>
      <div className="form-grid"><div className="form-group"><label className="form-label">Ticket en reparación</label><select className="form-control" value={ticketId} onChange={(event) => setTicketId(event.target.value)}><option value="">Selecciona un ticket</option>{tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.ticket_number} · {ticket.economic_number} · {ticket.description.slice(0, 45)}</option>)}</select></div><div className="form-group"><label className="form-label">Almacén origen</label><select className="form-control" value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>{data.warehouses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div></div>
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 18 }}><h2 style={{ fontSize: '1.05rem' }}>Agregar refacción</h2><div className="form-grid"><select className="form-control" value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Selecciona una refacción</option>{data.products.filter((product) => product.status === 'activo').map((product) => <option key={product.id} value={product.id}>{product.codeInternal} · {product.name} ({availableAtWarehouse(product.id)} en este almacén)</option>)}</select><input className="form-control" type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><button className="btn btn-outline" onClick={addItem}><Plus size={16} /> Agregar</button></div></div>
      <div style={{ marginTop: 20 }}>{items.length ? <table className="data-table"><thead><tr><th>Refacción</th><th>Cantidad</th><th>Costo</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.productId}><td>{item.productName}</td><td>{item.qty}</td><td>{formatMXN(item.qty * item.unitCost)}</td><td><button className="btn-icon" onClick={() => setItems(items.filter((entry) => entry.productId !== item.productId))}><Minus size={16} /></button></td></tr>)}</tbody></table> : <div className="empty-state"><PackageCheck className="empty-icon" /><p>Aún no hay refacciones en el despacho.</p></div>}</div>
      <div className="form-group" style={{ marginTop: 18 }}><label className="form-label">Observaciones</label><textarea className="form-control" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej.: se entregan al mecánico para diagnóstico y reparación." /></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={!selectedTicket || !items.length} onClick={submit}><Send size={16} /> Confirmar despacho</button></div>
    </div>
  </div>;
};
