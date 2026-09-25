import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wrench, Plus, CheckCircle, Clock, Trash2, Eye, X } from 'lucide-react';

export const WorkOrdersView = () => {
  const { data, addWorkOrder, updateWorkOrderStatus, formatMXN, activeUser, activeRole } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const initialForm = {
    unitId: data.units[0]?.id || '',
    economicNumber: data.units[0]?.economicNumber || '',
    type: 'preventivo',
    issueDescription: '',
    diagnosis: '',
    technician: 'Carlos M. / Taller',
    laborCost: 800,
    partsUsed: []
  };

  const [formData, setFormData] = useState(initialForm);

  // Draft part line for OT
  const [selectedProdId, setSelectedProdId] = useState(data.products[0]?.id || '');
  const [partQty, setPartQty] = useState(1);

  const canEdit = ['Administrador', 'Mecánico'].includes(activeRole);

  const handleOpenModal = () => {
    setFormData(initialForm);
    if (data.products.length > 0) setSelectedProdId(data.products[0].id);
    setModalOpen(true);
  };

  const handleAddPartToOT = () => {
    const prod = data.products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    if (partQty <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (prod.currentStock < partQty) {
      alert(`Stock insuficiente para "${prod.name}". Stock actual: ${prod.currentStock}`);
      return;
    }

    const newPart = {
      productId: prod.id,
      productCode: prod.codeInternal,
      name: prod.name,
      qty: Number(partQty),
      unitCost: prod.unitCost,
      totalCost: partQty * prod.unitCost
    };

    setFormData((prev) => ({
      ...prev,
      partsUsed: [...prev.partsUsed, newPart]
    }));
  };

  const handleRemovePartFromOT = (idx) => {
    setFormData((prev) => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const unit = data.units.find((u) => u.id === formData.unitId);
    const partsTotal = formData.partsUsed.reduce((acc, p) => acc + p.totalCost, 0);
    const totalCost = partsTotal + Number(formData.laborCost);

    const payload = {
      ...formData,
      economicNumber: unit ? unit.economicNumber : formData.economicNumber,
      unitInfo: unit ? `${unit.brand} ${unit.model} (${unit.year})` : '',
      totalCost
    };

    const success = addWorkOrder(payload);
    if (success) setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Órdenes de Trabajo / Taller Mecánico
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Mantenimiento preventivo y correctivo con asignación directa de refacciones por unidad
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={handleOpenModal}>
            <Plus size={18} /> Abrir Orden de Trabajo (OT)
          </button>
        )}
      </div>

      {/* Work Orders Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio OT</th>
                <th>Unidad</th>
                <th>Tipo</th>
                <th>Falla / Servicio Solicitado</th>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Costo Total MXN</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.workOrders.length > 0 ? (
                data.workOrders.map((w) => {
                  let badge = 'badge-warning';
                  if (w.status === 'terminada') badge = 'badge-success';
                  if (w.status === 'cancelada') badge = 'badge-danger';
                  if (w.status === 'abierta') badge = 'badge-gold';

                  return (
                    <tr key={w.id}>
                      <td><span className="badge badge-gold">{w.folio}</span></td>
                      <td style={{ fontWeight: 700 }}>{w.economicNumber}</td>
                      <td>
                        <span className={`badge ${w.type === 'preventivo' ? 'badge-info' : 'badge-dark'}`}>
                          {w.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', maxWidth: '240px' }}>
                        {w.issueDescription}
                      </td>
                      <td>{w.technician}</td>
                      <td><span className={`badge ${badge}`}>{w.status}</span></td>
                      <td style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{formatMXN(w.totalCost)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedOrder(w);
                              setDetailModalOpen(true);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && w.status !== 'terminada' && w.status !== 'cancelada' && (
                            <button
                              className="btn btn-gold btn-sm"
                              onClick={() => updateWorkOrderStatus(w.id, 'terminada')}
                              title="Marcar como Terminada"
                            >
                              <CheckCircle size={14} /> Finalizar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                    No existen órdenes de trabajo registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE WORK ORDER MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '840px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Abrir Nueva Orden de Trabajo (Taller)</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Unidad / Tráiler *</label>
                    <select
                      className="form-control"
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    >
                      {data.units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.economicNumber} - {u.brand} {u.model} ({u.plates})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Mantenimiento *</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="preventivo">Preventivo</option>
                      <option value="correctivo">Correctivo</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Descripción de Falla o Trabajo Solicitado *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      required
                      placeholder="e.g. Cambio de balatas de tambor traseras y revisión de fuga de aire"
                      value={formData.issueDescription}
                      onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Diagnóstico Técnico Inicial</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Diagnóstico del mecánico a cargo"
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Técnico Responsable *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.technician}
                      onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Costo Mano de Obra (MXN) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      required
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    />
                  </div>
                </div>

                {/* ADD PARTS USED SECTION */}
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: '#d4af37', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>
                    Asignar Refacciones de Almacén a esta Orden (Generará Salida Automática)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Refacción</label>
                      <select
                        className="form-control"
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(e.target.value)}
                      >
                        {data.products
                          .filter((p) => p.status === 'activo')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codeInternal} - {p.name} (${p.unitCost} MXN)
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={partQty}
                        onChange={(e) => setPartQty(e.target.value)}
                      />
                    </div>

                    <button type="button" className="btn btn-gold btn-sm" onClick={handleAddPartToOT}>
                      + Asignar Refacción
                    </button>
                  </div>
                </div>

                {/* PARTS LIST IN OT */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Refacciones Asignadas</h4>
                  {formData.partsUsed.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table dark">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Nombre Refacción</th>
                            <th>Cantidad</th>
                            <th>Costo Unit.</th>
                            <th>Total Refacciones</th>
                            <th>Quitar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.partsUsed.map((pt, idx) => (
                            <tr key={idx}>
                              <td>{pt.productCode}</td>
                              <td>{pt.name}</td>
                              <td>{pt.qty}</td>
                              <td>{formatMXN(pt.unitCost)}</td>
                              <td style={{ fontWeight: 700, color: '#d4af37' }}>{formatMXN(pt.totalCost)}</td>
                              <td>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  onClick={() => handleRemovePartFromOT(idx)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin refacciones agregadas a la OT aún.</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Abrir Orden de Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL OT MODAL */}
      {detailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Orden de Trabajo {selectedOrder.folio}</h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <div><strong>Unidad:</strong> {selectedOrder.economicNumber}</div>
                <div><strong>Tipo Mantenimiento:</strong> {selectedOrder.type}</div>
                <div><strong>Estado:</strong> <span className="badge badge-gold">{selectedOrder.status}</span></div>
                <div><strong>Técnico:</strong> {selectedOrder.technician}</div>
                <div><strong>Apertura:</strong> {selectedOrder.openDate}</div>
                <div><strong>Cierre:</strong> {selectedOrder.closeDate || 'En proceso'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Falla Solicitada:</strong> {selectedOrder.issueDescription}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Diagnóstico:</strong> {selectedOrder.diagnosis || 'N/A'}</div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Refacciones Utilizadas</h4>
              {selectedOrder.partsUsed && selectedOrder.partsUsed.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Refacción</th>
                        <th>Cantidad</th>
                        <th>Costo Unit.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.partsUsed.map((p, idx) => (
                        <tr key={idx}>
                          <td>{p.productCode}</td>
                          <td>{p.name}</td>
                          <td>{p.qty}</td>
                          <td>{formatMXN(p.unitCost)}</td>
                          <td style={{ fontWeight: 700 }}>{formatMXN(p.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No se asignaron refacciones del catálogo a esta OT.</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#e2e8f0', padding: '12px 16px', borderRadius: '8px', fontWeight: 800 }}>
                <div>Mano de Obra: {formatMXN(selectedOrder.laborCost)}</div>
                <div style={{ color: '#2563eb', fontSize: '1.1rem' }}>TOTAL OT: {formatMXN(selectedOrder.totalCost)}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setDetailModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
