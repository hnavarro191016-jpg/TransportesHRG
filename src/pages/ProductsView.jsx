import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Filter, Edit, Eye, Power, AlertTriangle, PackageCheck, Image as ImageIcon, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const ProductsView = ({ globalSearch }) => {
  const { data, addProduct, updateProduct, toggleProductStatus, formatMXN, activeRole } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Deactivation confirm modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, productId: null });

  // Initial Form State
  const initialForm = {
    codeInternal: '',
    codeSupplier: '',
    name: '',
    description: '',
    category: data.categories[0]?.name || 'Motor',
    brand: data.brands[0]?.name || 'Bendix',
    unitOfMeasure: 'pieza',
    compatibility: '',
    unitCost: 0,
    refPrice: 0,
    currentStock: 0,
    minStock: 5,
    maxStock: 50,
    warehouse: data.warehouses[0]?.name || 'Almacén Taller Central',
    locationDetails: '',
    photoUrl: '',
    status: 'activo'
  };

  const [formData, setFormData] = useState(initialForm);

  const canEdit = ['Administrador', 'Encargado de almacén'].includes(activeRole);

  const handleOpenCreate = () => {
    setFormData({
      ...initialForm,
      codeInternal: `REF-${1000 + data.products.length + 1}`
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setFormData(p);
    setSelectedProduct(p);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (p) => {
    setSelectedProduct(p);
    setIsDetailOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(formData.currentStock) < 0) {
      alert('Error: No se permite stock negativo');
      return;
    }

    if (isEditMode) {
      const success = updateProduct(formData);
      if (success) setIsModalOpen(false);
    } else {
      addProduct(formData);
      setIsModalOpen(false);
    }
  };

  // Filter products list
  const filteredProducts = data.products.filter((p) => {
    const query = (search || globalSearch).toLowerCase();
    const matchesSearch =
      p.codeInternal.toLowerCase().includes(query) ||
      p.codeSupplier.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.compatibility.toLowerCase().includes(query);

    const matchesCat = categoryFilter ? p.category === categoryFilter : true;
    const matchesBrand = brandFilter ? p.brand === brandFilter : true;
    const matchesWh = warehouseFilter ? p.warehouse === warehouseFilter : true;
    const matchesStatus = statusFilter ? p.status === statusFilter : true;

    return matchesSearch && matchesCat && matchesBrand && matchesWh && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Catálogo de Productos y Refacciones
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Registro y control de inventario físico de piezas de tráiler
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={handleOpenCreate}>
            <Plus size={18} /> Nuevo Producto / Refacción
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="dark-card" style={{ padding: '16px 20px', marginBottom: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Text Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar refacción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Category Filter */}
          <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas las Categorías</option>
            {data.categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Brand Filter */}
          <select className="form-control" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="">Todas las Marcas</option>
            {data.brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          {/* Warehouse Filter */}
          <select className="form-control" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="">Todos los Almacenes</option>
            {data.warehouses.map((w) => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los Estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Refacción / Descripción</th>
                <th>Categoría / Marca</th>
                <th>Stock Actual</th>
                <th>Costo Unitario</th>
                <th>Almacén y Ubicación</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p.id} style={{ opacity: p.status === 'inactivo' ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{p.codeInternal}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Prov: {p.codeSupplier || '-'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Compatibilidad: {p.compatibility}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{p.category}</span>
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', fontWeight: 600 }}>{p.brand}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: isOut ? '#ef4444' : isLow ? '#f59e0b' : 'var(--color-text-main)' }}>
                            {p.currentStock} {p.unitOfMeasure}
                          </span>
                          {isOut && <span className="badge badge-danger">Agotado</span>}
                          {isLow && <span className="badge badge-warning">Bajo</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Mín: {p.minStock} | Máx: {p.maxStock}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{formatMXN(p.unitCost)}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{p.warehouse}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.locationDetails || 'Sin ubicación específica'}</div>
                      </td>
                      <td>
                        {p.status === 'activo' ? (
                          <span className="badge badge-success">Activo</span>
                        ) : (
                          <span className="badge badge-danger">Inactivo</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenDetail(p)}
                            title="Ver Detalle"
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                className="btn btn-dark btn-sm"
                                onClick={() => handleOpenEdit(p)}
                                title="Editar Refacción"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className={`btn btn-sm ${p.status === 'activo' ? 'btn-danger' : 'btn-gold'}`}
                                onClick={() => setConfirmModal({ isOpen: true, productId: p.id })}
                                title={p.status === 'activo' ? 'Desactivar' : 'Activar'}
                              >
                                <Power size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">
                      <PackageCheck className="empty-icon" />
                      <h4>No se encontraron refacciones registrados</h4>
                      <p>Intenta ajustar los filtros de búsqueda o registra una nueva refacción.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT FORM MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {isEditMode ? 'Editar Refacción' : 'Registrar Nueva Refacción'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Código Interno *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.codeInternal}
                      onChange={(e) => setFormData({ ...formData, codeInternal: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Código Proveedor / Fabricante</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.codeSupplier}
                      onChange={(e) => setFormData({ ...formData, codeSupplier: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nombre de la Refacción *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {data.categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Marca *</label>
                    <select
                      className="form-control"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    >
                      {data.brands.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unidad de Medida *</label>
                    <select
                      className="form-control"
                      value={formData.unitOfMeasure}
                      onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                    >
                      <option value="pieza">pieza</option>
                      <option value="litro">litro</option>
                      <option value="juego">juego</option>
                      <option value="caja">caja</option>
                      <option value="kilogramo">kilogramo</option>
                      <option value="metro">metro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Compatibilidad con Tráilers</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Freightliner Cascadia, Kenworth T680"
                      value={formData.compatibility}
                      onChange={(e) => setFormData({ ...formData, compatibility: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Costo Unitario (MXN) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      required
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Precio Referencia (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={formData.refPrice}
                      onChange={(e) => setFormData({ ...formData, refPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Actual (No Negativo) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      required
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Mínimo *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      required
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Máximo *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      required
                      value={formData.maxStock}
                      onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Almacén Asignado *</label>
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

                  <div className="form-group">
                    <label className="form-label">Ubicación Física</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Estante A1 - Frenos"
                      value={formData.locationDetails}
                      onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  {isEditMode ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {isDetailOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Refacción</h3>
              <button onClick={() => setIsDetailOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-gold">{selectedProduct.codeInternal}</span>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '6px', color: 'var(--color-text-main)' }}>
                    {selectedProduct.name}
                  </h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{selectedProduct.description || 'Sin descripción'}</p>
                </div>
                <span className={`badge ${selectedProduct.status === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedProduct.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>CÓDIGO PROVEEDOR</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedProduct.codeSupplier || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>CATEGORÍA Y MARCA</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedProduct.category} ({selectedProduct.brand})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>STOCK ACTUAL</span>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>
                    {selectedProduct.currentStock} {selectedProduct.unitOfMeasure}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Mín: {selectedProduct.minStock} | Máx: {selectedProduct.maxStock}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>COSTO UNITARIO (MXN)</span>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#d4af37' }}>
                    {formatMXN(selectedProduct.unitCost)}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>COMPATIBILIDAD CON TRÁILERES</span>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedProduct.compatibility || 'Universal'}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ALMACÉN Y UBICACIÓN FÍSICA</span>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedProduct.warehouse} &gt; {selectedProduct.locationDetails || 'General'}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setIsDetailOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DEACTIVATION */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cambiar Estado de Producto"
        message="¿Estás seguro de cambiar el estado de esta refacción? Los productos inactivos no aparecerán en nuevas órdenes de salida."
        confirmText="Confirmar Estado"
        onConfirm={() => {
          toggleProductStatus(confirmModal.productId);
          setConfirmModal({ isOpen: false, productId: null });
        }}
        onCancel={() => setConfirmModal({ isOpen: false, productId: null })}
      />
    </div>
  );
};
