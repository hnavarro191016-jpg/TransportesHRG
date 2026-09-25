import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, AlertCircle, Clock, Calendar, PackageCheck, ArrowRight } from 'lucide-react';

export const AlertsView = ({ setCurrentView }) => {
  const { data, formatMXN } = useApp();

  const lowStockProducts = data.products.filter(p => p.status === 'activo' && p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStockProducts = data.products.filter(p => p.status === 'activo' && p.currentStock === 0);
  const expiringProducts = data.products.filter(p => p.expirationDate && p.expirationDate !== '');
  const openWorkOrders = data.workOrders.filter(w => w.status === 'abierta' || w.status === 'en proceso');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={24} style={{ color: '#f59e0b' }} /> Centro de Alertas y Notificaciones Operativas
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Alertas de inventario en riesgo, quiebres de stock y mantenimientos de flota pendientes
        </p>
      </div>

      {/* Summary Alert Grid */}
      <div className="metrics-grid">
        <div className="metric-card warning">
          <span className="metric-label">Stock Bajo Mínimo</span>
          <span className="metric-value" style={{ color: '#f59e0b' }}>{lowStockProducts.length}</span>
          <span className="metric-sub">Requiere pedido a proveedor</span>
        </div>

        <div className="metric-card danger">
          <span className="metric-label">Stock Agotado (Existencia 0)</span>
          <span className="metric-value" style={{ color: '#ef4444' }}>{outOfStockProducts.length}</span>
          <span className="metric-sub">Desabasto crítico en taller</span>
        </div>

        <div className="metric-card blue">
          <span className="metric-label">Órdenes de Trabajo Pendientes</span>
          <span className="metric-value" style={{ color: '#2563eb' }}>{openWorkOrders.length}</span>
          <span className="metric-sub">Unidades en mantenimiento</span>
        </div>

        <div className="metric-card gold">
          <span className="metric-label">Monitoreo Caducidad</span>
          <span className="metric-value" style={{ color: '#d4af37' }}>{expiringProducts.length}</span>
          <span className="metric-sub">Fluidos/químicos con fecha</span>
        </div>
      </div>

      {/* Out of Stock Alert Section */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> 1. Productos Completamente Agotados (Stock 0)
          </h3>
          <button className="btn btn-gold btn-sm" onClick={() => setCurrentView('compras')}>
            Registrar Entradas por Compra
          </button>
        </div>

        {outOfStockProducts.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Refacción</th>
                  <th>Categoría / Marca</th>
                  <th>Stock Mínimo</th>
                  <th>Almacén</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {outOfStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td><span className="badge badge-gold">{p.codeInternal}</span></td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.category} ({p.brand})</td>
                    <td><span className="badge badge-danger">Mín: {p.minStock} {p.unitOfMeasure}</span></td>
                    <td>{p.warehouse}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setCurrentView('compras')}>
                        Reabastecer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#166534', background: '#dcfce7', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
            ✓ No hay productos agotados actualmente.
          </div>
        )}
      </div>

      {/* Low Stock Alert Section */}
      <div className="content-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d97706', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} /> 2. Productos por Debajo del Stock Mínimo
        </h3>

        {lowStockProducts.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Refacción</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Stock Máximo</th>
                  <th>Almacén</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td><span className="badge badge-dark">{p.codeInternal}</span></td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td style={{ fontWeight: 800, color: '#f59e0b' }}>{p.currentStock} {p.unitOfMeasure}</td>
                    <td>{p.minStock}</td>
                    <td>{p.maxStock}</td>
                    <td>{p.warehouse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#166534', background: '#dcfce7', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
            ✓ Todos los productos activos mantienen existencias óptimas sobre el mínimo.
          </div>
        )}
      </div>

      {/* Open Work Orders Alert Section */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} style={{ color: '#2563eb' }} /> 3. Órdenes de Trabajo Abiertas o Retrasadas en Taller
          </h3>
          <button className="btn btn-outline btn-sm" onClick={() => setCurrentView('ordenes')}>
            Gestionar Órdenes OT
          </button>
        </div>

        {openWorkOrders.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio OT</th>
                  <th>Unidad</th>
                  <th>Servicio Solicitado</th>
                  <th>Técnico Responsable</th>
                  <th>Fecha Apertura</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {openWorkOrders.map((w) => (
                  <tr key={w.id}>
                    <td><span className="badge badge-gold">{w.folio}</span></td>
                    <td style={{ fontWeight: 700 }}>{w.economicNumber}</td>
                    <td style={{ fontSize: '0.82rem' }}>{w.issueDescription}</td>
                    <td>{w.technician}</td>
                    <td>{w.openDate}</td>
                    <td><span className="badge badge-warning">{w.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No hay órdenes de trabajo pendientes en taller.</div>
        )}
      </div>

      {/* Expiring Products Prepared Section */}
      <div className="content-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} style={{ color: '#d4af37' }} /> 4. Productos Próximos a Caducar (Preparado)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
          Módulo de monitoreo de caducidad para lubricantes, aceites, selladores y químicos de taller.
        </p>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto Químico / Aceite</th>
                <th>Lote / Control</th>
                <th>Fecha Caducidad</th>
                <th>Stock</th>
                <th>Estado Caducidad</th>
              </tr>
            </thead>
            <tbody>
              {expiringProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.codeInternal}</td>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td>LOTE-2026-A</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{p.expirationDate}</td>
                  <td>{p.currentStock} {p.unitOfMeasure}</td>
                  <td><span className="badge badge-success">Vigente (OK)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
