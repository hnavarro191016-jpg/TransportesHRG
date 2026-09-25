import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowUpRight, Plus, Trash2, Eye, X } from 'lucide-react';

export const ExitsView = () => {
  const { data, addExit, formatMXN, activeUser, activeRole } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExit, setSelectedExit] = useState(null);

  const initialForm = {
    reason: 'Mantenimiento preventivo',
    unitId: '',
    economicNumber: '',
    workOrderFolio: '',
    warehouse: data.warehouses[0]?.name || 'Almacén Taller Central',
    notes: '',
    items: []
  };

  const [formData, setFormData] = useState(initialForm);

  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState(1);

  const canEdit = ['Administrador', 'Encargado de almacén'].includes(activeRole);

  const handleOpenModal = () => {
    setFormData(initialForm);
    if (data.products.length > 0) setSelectedProdId(data.products[0].id);
    setModalOpen(true);
  };

  const handleAddItem = () => {
    const prod = data.products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    if (itemQty <= 0) {
      alert('La cantidad debe ser mayor a cero');
      return;
    }

    if (prod.currentStock < itemQty) {
      alert(`Stock insuficiente para "${prod.name}". Stock actual: ${prod.currentStock}, Solicitado: ${itemQty}`);
      return;
    }

    const subtotal = itemQty * prod.unitCost;

    const newItem = {
      productId: prod.id,
      productCode: prod.codeInternal,
      productName: prod.name,
      qty: Number(itemQty),
      unitCost: prod.unitCost,
      subtotal
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Debe agregar al menos una refacción a la salida');
      return;
    }

    const totalCost = formData.items.reduce((acc, item) => acc + item.subtotal, 0);
    const unit = data.units.find((u) => u.id === formData.unitId);

    const exitPayload = {
      ...formData,
      economicNumber: unit ? unit.economicNumber : formData.economicNumber,
      responsibleUser: activeUser.name,
      totalCost
    };

    const success = await addExit(exitPayload);
    if (success) setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Salidas de Inventario
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Descuento de stock por mantenimiento de flota, consumo o mermas
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={handleOpenModal}>
            <Plus size={18} /> Registrar Salida de Almacén
          </button>
        )}
      </div>

      {/* Exits Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Unidad Asignada</th>
                <th>Almacén Origen</th>
                <th>Partidas</th>
                <th>Costo Total MXN</th>
                <th style={{ textAlign: 'right' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.exits.length > 0 ? (
                data.exits.map((e) => {
                  const totalPiezas = e.items.reduce((acc, item) => acc + Number(item.qty), 0);
                  return (
                    <tr key={e.id}>
                      <td><span className="badge badge-dark">{e.folio}</span></td>
                      <td>{e.date}</td>
                      <td style={{ fontWeight: 700 }}>{e.reason}</td>
                      <td>{e.economicNumber ? <span className="badge badge-gold">{e.economicNumber}</span> : '-'}</td>
                      <td>{e.warehouse}</td>
                      <td><span className="badge badge-info">{totalPiezas} piezas</span></td>
                      <td style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{formatMXN(e.totalCost)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedExit(e);
                            setDetailModalOpen(true);
                          }}
                        >
                          <Eye size={14} /> Ver Salida
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                    Sin salidas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER EXIT MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Salida de Inventario</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Motivo de Salida *</label>
                    <select
                      className="form-control"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    >
                      <option value="Mantenimiento preventivo">Mantenimiento preventivo</option>
                      <option value="Reparación correctiva">Reparación correctiva</option>
                      <option value="Asignación a unidad">Asignación a unidad</option>
                      <option value="Consumo interno">Consumo interno</option>
                      <option value="Merma o daño">Merma o daño</option>
                      <option value="Robo o extravío">Robo o extravío</option>
                      <option value="Devolución a proveedor">Devolución a proveedor</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unidad / Tráiler Relacionado</label>
                    <select
                      className="form-control"
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    >
                      <option value="">-- Sin unidad asignada --</option>
                      {data.units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.economicNumber} - {u.brand} ({u.plates})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Folio Orden Trabajo (Opcional)</label>
                    <select
                      className="form-control"
                      value={formData.workOrderFolio}
                      onChange={(e) => setFormData({ ...formData, workOrderFolio: e.target.value })}
                    >
                      <option value="">-- Ninguna --</option>
                      {data.workOrders
                        .filter(w => formData.unitId ? w.unitId === formData.unitId : true)
                        .map((w) => (
                        <option key={w.id} value={w.folio}>
                          {w.folio} - {w.type} {w.economicNumber ? `(${w.economicNumber})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Almacén Origen *</label>
                    <select
                      className="form-control"
                      value={formData.warehouse}
                      onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    >
                      {data.warehouses.map((w) => (
                        <option key={w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ADD ITEMS SECTION */}
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: '#d4af37', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>
                    Seleccionar Refacción para Salida
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Refacción en Almacén</label>
                      <select
                        className="form-control"
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(e.target.value)}
                      >
                        {data.products
                          .filter((p) => p.status === 'activo')
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.codeInternal} - {p.name} (Stock Disp: {p.currentStock})
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
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                      />
                    </div>

                    <button type="button" className="btn btn-gold btn-sm" onClick={handleAddItem}>
                      + Agregar a Salida
                    </button>
                  </div>
                </div>

                {/* ITEMS DRAFT LIST */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Refacciones a Descontar</h4>
                  {formData.items.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table dark">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Costo Unit.</th>
                            <th>Subtotal</th>
                            <th>Eliminar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((it, idx) => (
                            <tr key={idx}>
                              <td>{it.productCode}</td>
                              <td>{it.productName}</td>
                              <td>{it.qty}</td>
                              <td>{formatMXN(it.unitCost)}</td>
                              <td style={{ fontWeight: 700, color: '#d4af37' }}>{formatMXN(it.subtotal)}</td>
                              <td>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  onClick={() => handleRemoveItem(idx)}
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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Ninguna refacción agregada a la lista.</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Confirmar y Aplicar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedExit && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Salida {selectedExit.folio}</h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <div><strong>Motivo:</strong> {selectedExit.reason}</div>
                <div><strong>Unidad:</strong> {selectedExit.economicNumber || 'N/A'}</div>
                <div><strong>Almacén Origen:</strong> {selectedExit.warehouse}</div>
                <div><strong>Fecha:</strong> {selectedExit.date}</div>
                <div><strong>Usuario Responsable:</strong> {selectedExit.responsibleUser}</div>
                <div><strong>Orden de Trabajo:</strong> {selectedExit.workOrderFolio || 'N/A'}</div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Refacciones Entregadas</h4>
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
                    {selectedExit.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.productCode}</td>
                        <td>{it.productName}</td>
                        <td>{it.qty}</td>
                        <td>{formatMXN(it.unitCost)}</td>
                        <td style={{ fontWeight: 700 }}>{formatMXN(it.unitCost * it.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
