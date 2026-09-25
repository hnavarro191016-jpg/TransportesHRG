import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardCheck, Plus, Check, Eye, X } from 'lucide-react';

export const PhysicalInventoryView = () => {
  const { data, addAdjustment, activeUser, activeRole } = useApp();

  const [selectedWh, setSelectedWh] = useState(data.warehouses[0]?.name || 'Almacén Taller Central');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);

  // Physical counts input map: { [productId]: countedValue }
  const [counts, setCounts] = useState({});
  const [reason, setReason] = useState('Conteo físico semestral');
  const [notes, setNotes] = useState('');

  const canEdit = ['Administrador', 'Encargado de almacén'].includes(activeRole);

  const warehouseProducts = data.products.filter((p) => p.warehouse === selectedWh);

  const handleCountChange = (productId, val) => {
    setCounts((prev) => ({
      ...prev,
      [productId]: val
    }));
  };

  const handleApplyAdjustment = async () => {
    const affectedItems = [];

    warehouseProducts.forEach((p) => {
      if (counts[p.id] !== undefined && counts[p.id] !== '') {
        const counted = Number(counts[p.id]);
        if (counted !== p.currentStock) {
          affectedItems.push({
            productId: p.id,
            productCode: p.codeInternal,
            productName: p.name,
            previousQty: p.currentStock,
            adjustedQty: counted,
            diff: counted - p.currentStock,
            unitCost: p.unitCost
          });
        }
      }
    });

    if (affectedItems.length === 0) {
      alert('No hay diferencias de stock ingresadas para ajustar');
      return;
    }

    const payload = {
      warehouse: selectedWh,
      reason,
      notes,
      items: affectedItems,
      responsibleUser: activeUser.name
    };

    const success = await addAdjustment(payload);
    if (success) {
      setCounts({});
      setModalOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Inventario Físico y Ajustes de Stock
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Auditoría de almacén, comparación de inventario teórico vs conteo real y registro de mermas
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <ClipboardCheck size={18} /> Iniciar Conteo Físico por Almacén
          </button>
        )}
      </div>

      {/* Warehouse Selector Card */}
      <div className="dark-card" style={{ padding: '16px 20px', marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#d4af37', fontSize: '0.9rem' }}>Seleccionar Almacén a Auditar:</span>
          <select
            className="form-control"
            style={{ maxWidth: '280px' }}
            value={selectedWh}
            onChange={(e) => {
              setSelectedWh(e.target.value);
              setCounts({});
            }}
          >
            {data.warehouses.map((w) => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Historical Adjustments Table */}
      <div className="content-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '16px' }}>
          Historial de Ajustes Aplicados ({selectedWh})
        </h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio Ajuste</th>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Productos Afectados</th>
                <th>Usuario Responsable</th>
                <th style={{ textAlign: 'right' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const adjList = data.physicalAdjustments.filter((a) => a.warehouse === selectedWh);
                if (adjList.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        Sin ajustes de inventario registrados en este almacén
                      </td>
                    </tr>
                  );
                }
                return adjList.map((adj) => (
                  <tr key={adj.id}>
                    <td><span className="badge badge-gold">{adj.folio}</span></td>
                    <td>{adj.date}</td>
                    <td style={{ fontWeight: 700 }}>{adj.reason}</td>
                    <td><span className="badge badge-danger">{adj.items.length} piezas</span></td>
                    <td>{adj.responsibleUser}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSelectedAdjustment(adj);
                          setDetailModalOpen(true);
                        }}
                      >
                        <Eye size={14} /> Ver Ajuste
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* PHYSICAL AUDIT CONTEO MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Conteo Físico: {selectedWh}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Motivo del Ajuste *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Detalles sobre las diferencias encontradas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table dark">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Refacción</th>
                      <th>Stock Teórico</th>
                      <th>Cantidad Contada</th>
                      <th>Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseProducts.map((p) => {
                      const countedVal = counts[p.id] !== undefined ? counts[p.id] : p.currentStock;
                      const diff = Number(countedVal) - p.currentStock;

                      return (
                        <tr key={p.id}>
                          <td>{p.codeInternal}</td>
                          <td>{p.name}</td>
                          <td style={{ fontWeight: 700 }}>{p.currentStock} {p.unitOfMeasure}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control"
                              style={{ width: '100px', padding: '4px 8px' }}
                              value={countedVal}
                              onChange={(e) => handleCountChange(p.id, e.target.value)}
                            />
                          </td>
                          <td>
                            {diff === 0 ? (
                              <span className="badge badge-success">0</span>
                            ) : diff > 0 ? (
                              <span className="badge badge-gold">+{diff}</span>
                            ) : (
                              <span className="badge badge-danger">{diff}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-gold btn-sm" onClick={handleApplyAdjustment}>
                Aplicar Ajustes a Inventario y Kardex
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedAdjustment && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Ajuste {selectedAdjustment.folio}</h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div><strong>Almacén:</strong> {selectedAdjustment.warehouse}</div>
                <div><strong>Motivo:</strong> {selectedAdjustment.reason}</div>
                <div><strong>Fecha:</strong> {selectedAdjustment.date}</div>
                <div><strong>Responsable:</strong> {selectedAdjustment.responsibleUser}</div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Afectaciones Registradas</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Producto</th>
                      <th>Anterior</th>
                      <th>Ajustado</th>
                      <th>Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAdjustment.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.productCode}</td>
                        <td>{it.productName}</td>
                        <td>{it.previousQty}</td>
                        <td>{it.adjustedQty}</td>
                        <td style={{ fontWeight: 800, color: it.diff < 0 ? '#ef4444' : '#2563eb' }}>
                          {it.diff > 0 ? `+${it.diff}` : it.diff}
                        </td>
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
