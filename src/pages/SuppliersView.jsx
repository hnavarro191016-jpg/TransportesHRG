import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Users, Search, ShoppingBag, Eye, X } from 'lucide-react';

export const SuppliersView = () => {
  const { data, addSupplier, formatMXN, activeRole } = useApp();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const initialForm = {
    name: '',
    rfc: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '30 días crédito',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const canEdit = ['Administrador', 'Compras'].includes(activeRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    addSupplier(formData);
    setFormData(initialForm);
    setModalOpen(false);
  };

  const handleOpenHistory = (sup) => {
    setSelectedSupplier(sup);
    setHistoryModalOpen(true);
  };

  const filteredSuppliers = data.suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rfc.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Directorio de Proveedores
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Registro de fabricantes y distribuidores de piezas pesadas
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Registrar Proveedor
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
            placeholder="Buscar por nombre, RFC o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Razón Social / RFC</th>
                <th>Contacto</th>
                <th>Teléfono / Correo</th>
                <th>Condiciones Pago</th>
                <th>Compras Realizadas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Historial</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s) => {
                const purchasesCount = data.purchases.filter((p) => p.supplierId === s.id).length;

                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>RFC: {s.rfc || 'Sin RFC'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.contact}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.address}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.phone}</div>
                      <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>{s.email}</div>
                    </td>
                    <td><span className="badge badge-gold">{s.paymentTerms}</span></td>
                    <td>
                      <span className="badge badge-info">{purchasesCount} órdenes</span>
                    </td>
                    <td>
                      <span className="badge badge-success">Activo</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-dark btn-sm" onClick={() => handleOpenHistory(s)}>
                        <ShoppingBag size={14} /> Ver Compras
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER SUPPLIER MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Proveedor</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Razón Social / Nombre Comercial *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Distribuidora de Partes Pesadas S.A. de C.V."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">RFC *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. DPP981120TR4"
                      value={formData.rfc}
                      onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Persona de Contacto</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ing. Carlos Mendoza"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="81-8390-1200"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="ventas@proveedor.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Dirección Fiscal / Bodega</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Calle, Número, Colonia, Ciudad"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Condiciones de Pago</label>
                    <select
                      className="form-control"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    >
                      <option value="Contado">Contado</option>
                      <option value="15 días crédito">15 días crédito</option>
                      <option value="30 días crédito">30 días crédito</option>
                      <option value="60 días crédito">60 días crédito</option>
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
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER PURCHASE HISTORY MODAL */}
      {historyModalOpen && selectedSupplier && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Historial de Compras: {selectedSupplier.name}</h3>
              <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                const purchases = data.purchases.filter((p) => p.supplierId === selectedSupplier.id);
                if (purchases.length === 0) {
                  return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No hay registros de compras recientes con este proveedor.</p>;
                }
                return (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Folio Entrada</th>
                          <th>Fecha</th>
                          <th>Factura</th>
                          <th>Almacén Destino</th>
                          <th>Monto Total MXN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((p) => (
                          <tr key={p.id}>
                            <td><span className="badge badge-gold">{p.folio}</span></td>
                            <td>{p.date}</td>
                            <td>{p.invoiceNumber || 'S/N'}</td>
                            <td>{p.warehouse}</td>
                            <td style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{formatMXN(p.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setHistoryModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
