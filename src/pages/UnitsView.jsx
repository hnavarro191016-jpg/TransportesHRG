import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Truck, Plus, Search, Wrench, History, Eye, X } from 'lucide-react';

export const UnitsView = () => {
  const { data, addUnit, updateUnit, formatMXN, activeRole } = useApp();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const initialForm = {
    economicNumber: '',
    plates: '',
    unitType: 'Tractor Quinta Rueda',
    brand: 'Freightliner',
    model: 'Cascadia',
    year: 2023,
    vin: '',
    status: 'activo',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const canEdit = ['Administrador', 'Encargado de almacén', 'Mecánico'].includes(activeRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.economicNumber) return;
    addUnit(formData);
    setFormData(initialForm);
    setModalOpen(false);
  };

  const handleOpenDetail = (unit) => {
    setSelectedUnit(unit);
    setDetailModalOpen(true);
  };

  const filteredUnits = data.units.filter(
    (u) =>
      (u.economicNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.plates || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.vin || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Flota de Unidades y Tráilers
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Control vehicular, asignación de mantenimiento y consumo de refacciones por unidad
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Registrar Unidad
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="dark-card" style={{ padding: '16px 20px', marginBottom: '0' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por Num. Económico, placas o VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Num. Económico</th>
                <th>Tipo / Marca / Modelo</th>
                <th>Placas / VIN</th>
                <th>Año</th>
                <th>Órdenes de Trabajo</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Historial Refacciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => {
                const workOrdersCount = data.workOrders.filter((w) => w.unitId === u.id || w.economicNumber === u.economicNumber).length;
                let badgeClass = 'badge-success';
                if (u.status === 'en mantenimiento') badgeClass = 'badge-warning';
                if (u.status === 'inactivo') badgeClass = 'badge-danger';

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>{u.economicNumber}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{u.unitType}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.brand} {u.model}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#2563eb' }}>{u.plates}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>VIN: {u.vin}</div>
                    </td>
                    <td><span className="badge badge-dark">{u.year}</span></td>
                    <td>
                      <span className="badge badge-info">{workOrdersCount} OT realizadas</span>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{u.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-dark btn-sm" onClick={() => handleOpenDetail(u)}>
                        <Wrench size={14} /> Mantenimientos
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER UNIT MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nueva Unidad / Tráiler</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Número Económico *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Eco-104"
                      value={formData.economicNumber}
                      onChange={(e) => setFormData({ ...formData, economicNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Placas Federales *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. 84-AA-1K"
                      value={formData.plates}
                      onChange={(e) => setFormData({ ...formData, plates: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Unidad *</label>
                    <select
                      className="form-control"
                      value={formData.unitType}
                      onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    >
                      <option value="Tractor Quinta Rueda">Tractor Quinta Rueda</option>
                      <option value="Remolque Caja Seca 53ft">Remolque Caja Seca 53ft</option>
                      <option value="Remolque Plana 48ft">Remolque Plana 48ft</option>
                      <option value="Remolque Tanque / Pipa">Remolque Tanque / Pipa</option>
                      <option value="Dolly Convertidor">Dolly Convertidor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Marca *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Freightliner"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Modelo *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Cascadia 126"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Año Modelo *</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">VIN / Número de Serie *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. 3AKJHHDR8NSLK1902"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado Inicial *</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="activo">Activo</option>
                      <option value="en mantenimiento">En Mantenimiento</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Guardar Unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIT DETAIL AND SPARE PARTS CONSUMPTION HISTORY MODAL */}
      {detailModalOpen && selectedUnit && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Historial de Mantenimientos y Refacciones: {selectedUnit.economicNumber}</h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Info summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>TIPO Y MARCA</span>
                  <div style={{ fontWeight: 700 }}>{selectedUnit.unitType} - {selectedUnit.brand} {selectedUnit.model}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>PLACAS Y AÑO</span>
                  <div style={{ fontWeight: 700 }}>{selectedUnit.plates} ({selectedUnit.year})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ESTADO ACTUAL</span>
                  <div><span className="badge badge-gold">{selectedUnit.status}</span></div>
                </div>
              </div>

              {/* Maintenance History */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '10px' }}>
                  Órdenes de Trabajo Realizadas
                </h4>
                {(() => {
                  const wOrders = data.workOrders.filter(w => w.unitId === selectedUnit.id || w.economicNumber === selectedUnit.economicNumber);
                  if (wOrders.length === 0) return <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sin órdenes de trabajo registradas para esta unidad.</p>;
                  return (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Folio OT</th>
                            <th>Tipo</th>
                            <th>Falla / Trabajo</th>
                            <th>Técnico</th>
                            <th>Estado</th>
                            <th>Costo Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wOrders.map(w => (
                            <tr key={w.id}>
                              <td><span className="badge badge-gold">{w.folio}</span></td>
                              <td>{w.type}</td>
                              <td style={{ fontSize: '0.8rem' }}>{w.issueDescription}</td>
                              <td>{w.technician}</td>
                              <td><span className="badge badge-info">{w.status}</span></td>
                              <td style={{ fontWeight: 700 }}>{formatMXN(w.totalCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Spare Parts Consumed History */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '10px' }}>
                  Refacciones Salidas para esta Unidad
                </h4>
                {(() => {
                  const exits = data.exits.filter(e => e.unitId === selectedUnit.id || e.economicNumber === selectedUnit.economicNumber);
                  if (exits.length === 0) return <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No se han registrado salidas de refacciones para esta unidad.</p>;
                  return (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Folio Salida</th>
                            <th>Fecha</th>
                            <th>Motivo</th>
                            <th>Productos Instalados</th>
                            <th>Costo MXN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exits.map(e => (
                            <tr key={e.id}>
                              <td><span className="badge badge-dark">{e.folio}</span></td>
                              <td>{e.date}</td>
                              <td>{e.reason}</td>
                              <td style={{ fontSize: '0.8rem' }}>
                                {e.items.map((it, idx) => (
                                  <div key={idx}>- {it.productName} ({it.qty} unids)</div>
                                ))}
                              </td>
                              <td style={{ fontWeight: 700 }}>{formatMXN(e.totalCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
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
