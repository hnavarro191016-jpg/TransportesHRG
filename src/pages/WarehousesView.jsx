import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Warehouse, MapPin, Plus, Package, X } from 'lucide-react';

export const WarehousesView = () => {
  const { data, addWarehouse, activeRole } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const canEdit = ['Administrador', 'Encargado de almacén'].includes(activeRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    addWarehouse({ name, location, description });
    setName('');
    setLocation('');
    setDescription('');
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Almacenes y Ubicaciones
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Administración de centros de resguardo y ubicaciones físicas de refacciones
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Crear Almacén / Ubicación
          </button>
        )}
      </div>

      {/* Warehouses Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {data.warehouses.map((wh) => {
          const storedProducts = data.products.filter((p) => p.warehouse === wh.name);
          const totalStockCount = storedProducts.reduce((acc, p) => acc + p.currentStock, 0);

          return (
            <div key={wh.id} className="content-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0b0f17 0%, #1a2234 100%)',
                  color: '#d4af37',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)'
                }}>
                  <Warehouse size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{wh.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={14} style={{ color: '#2563eb' }} /> {wh.location || 'Sin dirección específica'}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {wh.description || 'Almacén operativo para refacciones y consumibles de transporte.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>CÁTALOGO REGISTRADO</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                    {storedProducts.length} refacciones
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>STOCK TOTAL FÍSICO</span>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
                    {totalStockCount} piezas
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE WAREHOUSE MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Almacén</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Almacén *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Almacén de Neumáticos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ubicación / Área</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Patio Central - Monterrey"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Descripción del almacén y tipo de refacciones resguardadas"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Guardar Almacén
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
