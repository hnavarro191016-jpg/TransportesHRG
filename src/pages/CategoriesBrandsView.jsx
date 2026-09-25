import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Tags, Award, X } from 'lucide-react';

export const CategoriesBrandsView = () => {
  const { data, addCategory, addBrand, activeRole } = useApp();

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [brandName, setBrandName] = useState('');

  const canEdit = ['Administrador', 'Encargado de almacén'].includes(activeRole);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!catName) return;
    addCategory({ name: catName, description: catDesc });
    setCatName('');
    setCatDesc('');
    setCatModalOpen(false);
  };

  const handleCreateBrand = (e) => {
    e.preventDefault();
    if (!brandName) return;
    addBrand({ name: brandName });
    setBrandName('');
    setBrandModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
          Gestión de Categorías y Marcas
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Clasificación oficial de productos para el catálogo de Transportes Romo
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* CATEGORIES SECTION */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tags size={18} style={{ color: '#2563eb' }} /> Categorías Registradas ({data.categories.length})
            </h3>
            {canEdit && (
              <button className="btn btn-gold btn-sm" onClick={() => setCatModalOpen(true)}>
                <Plus size={14} /> Nueva Categoría
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre Categoría</th>
                  <th>Descripción</th>
                  <th>Refacciones</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((cat) => {
                  const count = data.products.filter(p => p.category === cat.name).length;
                  return (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{cat.name}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cat.description || '-'}</td>
                      <td><span className="badge badge-gold">{count} prod.</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BRANDS SECTION */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: '#d4af37' }} /> Marcas de Refacciones ({data.brands.length})
            </h3>
            {canEdit && (
              <button className="btn btn-primary btn-sm" onClick={() => setBrandModalOpen(true)}>
                <Plus size={14} /> Nueva Marca
              </button>
            )}
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Marca</th>
                  <th>Productos Asignados</th>
                </tr>
              </thead>
              <tbody>
                {data.brands.map((b) => {
                  const count = data.products.filter(p => p.brand === b.name).length;
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{b.name}</td>
                      <td><span className="badge badge-info">{count} refacciones</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE CATEGORY MODAL */}
      {catModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Categoría</h3>
              <button onClick={() => setCatModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de Categoría *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Neumática"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Detalles sobre esta categoría"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCatModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BRAND MODAL */}
      {brandModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Agregar Marca</h3>
              <button onClick={() => setBrandModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateBrand}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de la Marca *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. STEMCO"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setBrandModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Guardar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
