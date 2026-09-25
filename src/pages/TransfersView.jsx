import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeftRight, Plus, Trash2, Eye, X } from 'lucide-react';

export const TransfersView = () => {
  const { data, addTransfer, activeUser, activeRole } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const initialForm = {
    originWarehouse: data.warehouses[0]?.name || 'Almacén Taller Central',
    destinationWarehouse: data.warehouses[1]?.name || 'Bodega de Lubricantes y Grasas',
    notes: '',
    items: []
  };

  const [formData, setFormData] = useState(initialForm);

  const [selectedProdId, setSelectedProdId] = useState(data.products[0]?.id || '');
  const [transferQty, setTransferQty] = useState(1);

  const canEdit = ['Administrador', 'Encargado de almacén'].includes(activeRole);

  const handleOpenModal = () => {
    setFormData(initialForm);
    if (data.products.length > 0) setSelectedProdId(data.products[0].id);
    setModalOpen(true);
  };

  const handleAddItem = () => {
    if (formData.originWarehouse === formData.destinationWarehouse) {
      alert('El almacén origen y el almacén destino deben ser distintos');
      return;
    }

    const prod = data.products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    if (transferQty <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const newItem = {
      productId: prod.id,
      productCode: prod.codeInternal,
      productName: prod.name,
      qty: Number(transferQty)
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (idx) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.originWarehouse === formData.destinationWarehouse) {
      alert('El almacén origen y el almacén destino no pueden ser iguales');
      return;
    }

    if (formData.items.length === 0) {
      alert('Debes incluir al menos un producto a transferir');
      return;
    }

    const payload = {
      ...formData,
      responsibleUser: activeUser.name
    };

    const success = await addTransfer(payload);
    if (success) setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Transferencias entre Almacenes
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Movimiento de refacciones entre ubicaciones sin alterar el inventario global
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={handleOpenModal}>
            <Plus size={18} /> Nueva Transferencia
          </button>
        )}
      </div>

      {/* Transfers Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Almacén Origen</th>
                <th>Almacén Destino</th>
                <th>Productos</th>
                <th>Usuario Responsable</th>
                <th style={{ textAlign: 'right' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.transfers.length > 0 ? (
                data.transfers.map((t) => (
                  <tr key={t.id}>
                    <td><span className="badge badge-gold">{t.folio}</span></td>
                    <td>{t.date}</td>
                    <td><span className="badge badge-dark">{t.originWarehouse}</span></td>
                    <td><span className="badge badge-info">{t.destinationWarehouse}</span></td>
                    <td><span className="badge badge-gold">{t.items.length} piezas</span></td>
                    <td>{t.responsibleUser}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSelectedTransfer(t);
                          setDetailModalOpen(true);
                        }}
                      >
                        <Eye size={14} /> Ver Transferencia
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                    Sin transferencias registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TRANSFER MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Transferencia de Almacén</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Almacén Origen *</label>
                    <select
                      className="form-control"
                      value={formData.originWarehouse}
                      onChange={(e) => setFormData({ ...formData, originWarehouse: e.target.value })}
                    >
                      {data.warehouses.map((w) => (
                        <option key={w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Almacén Destino *</label>
                    <select
                      className="form-control"
                      value={formData.destinationWarehouse}
                      onChange={(e) => setFormData({ ...formData, destinationWarehouse: e.target.value })}
                    >
                      {data.warehouses.map((w) => (
                        <option key={w.id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Motivo del traslado de refacciones"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                {/* ADD ITEMS SECTION */}
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: '#d4af37', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>
                    Seleccionar Producto a Mover
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Producto</label>
                      <select
                        className="form-control"
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(e.target.value)}
                      >
                        {data.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codeInternal} - {p.name}
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
                        value={transferQty}
                        onChange={(e) => setTransferQty(e.target.value)}
                      />
                    </div>

                    <button type="button" className="btn btn-gold btn-sm" onClick={handleAddItem}>
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* DRAFT ITEMS TABLE */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Refacciones en la Transferencia</h4>
                  {formData.items.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table dark">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Quitar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((it, idx) => (
                            <tr key={idx}>
                              <td>{it.productCode}</td>
                              <td>{it.productName}</td>
                              <td>{it.qty}</td>
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
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No hay partidas agregadas aún.</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Confirmar Transferencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedTransfer && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Transferencia {selectedTransfer.folio}</h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <div><strong>Origen:</strong> {selectedTransfer.originWarehouse}</div>
                <div><strong>Destino:</strong> {selectedTransfer.destinationWarehouse}</div>
                <div><strong>Fecha:</strong> {selectedTransfer.date}</div>
                <div><strong>Responsable:</strong> {selectedTransfer.responsibleUser}</div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Partidas Trasladadas</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Refacción</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransfer.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.productCode}</td>
                        <td>{it.productName}</td>
                        <td>{it.qty}</td>
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
