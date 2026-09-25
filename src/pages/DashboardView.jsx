import React from 'react';
import { useApp } from '../context/AppContext';
import { Package, DollarSign, AlertTriangle, AlertCircle, TrendingUp, TrendingDown, ArrowUpRight, ShoppingCart, Wrench } from 'lucide-react';

export const DashboardView = ({ setCurrentView }) => {
  const { data, formatMXN } = useApp();

  const totalProducts = data.products.length;
  const totalStockValue = data.products.reduce((acc, p) => acc + (p.currentStock * p.unitCost), 0);
  const lowStockProducts = data.products.filter(p => p.status === 'activo' && p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStockProducts = data.products.filter(p => p.status === 'activo' && p.currentStock === 0);

  // Recent Purchases & Exits
  const recentPurchases = data.purchases.slice(0, 4);
  const recentExits = data.exits.slice(0, 4);

  // Top 4 Most Used Parts based on exit records
  const usageMap = {};
  data.exits.forEach(exit => {
    exit.items.forEach(item => {
      usageMap[item.productName] = (usageMap[item.productName] || 0) + Number(item.qty);
    });
  });
  const mostUsedParts = Object.entries(usageMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  // SVG Bar Chart Data for monthly entries & exits (Dynamic)
  const getLast6Months = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        entradas: 0,
        salidas: 0
      });
    }
    return result;
  };

  const monthlyData = getLast6Months();

  data.purchases.forEach(p => {
    if (!p.date) return;
    const d = new Date(p.date);
    const monthItem = monthlyData.find(m => m.month === ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()] && m.year === d.getFullYear());
    if (monthItem) {
      // Sum the total items entered
      const itemsCount = p.items ? p.items.reduce((acc, it) => acc + Number(it.qty), 0) : 0;
      monthItem.entradas += itemsCount;
    }
  });

  data.exits.forEach(e => {
    if (!e.date) return;
    const d = new Date(e.date);
    const monthItem = monthlyData.find(m => m.month === ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()] && m.year === d.getFullYear());
    if (monthItem) {
      // Sum the total items exited
      const itemsCount = e.items ? e.items.reduce((acc, it) => acc + Number(it.qty), 0) : 0;
      monthItem.salidas += itemsCount;
    }
  });
  
  // Find max value for chart scaling
  const maxChartValue = Math.max(10, ...monthlyData.map(d => Math.max(d.entradas, d.salidas)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--bg-surface)',
        padding: '24px 32px',
        borderRadius: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'var(--color-text-main)'
      }}>
        <div>
          <span className="badge badge-gold" style={{ marginBottom: '8px' }}>Módulo Administrativo / Taller</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
            Panel de Control | Transportes HRG
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Supervisión integral de almacén de refacciones para flota de tráileres
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-gold" onClick={() => setCurrentView('compras')}>
            + Nueva Entrada por Compra
          </button>
          <button className="btn btn-primary" onClick={() => setCurrentView('salidas')}>
            + Registrar Salida
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: 'var(--color-danger)'
        }}>
          <AlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              Atención: Requiere Reabastecimiento Urgente
            </h4>
            <p style={{ fontSize: '0.82rem', marginTop: '2px' }}>
              Hay <strong>{outOfStockProducts.length} refacciones agotadas</strong> y <strong>{lowStockProducts.length} refacciones por debajo del stock mínimo</strong>.
            </p>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setCurrentView('alertas')}>
            Ver Alertas ({outOfStockProducts.length + lowStockProducts.length})
          </button>
        </div>
      )}

      {/* 4 Main Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card blue">
          <span className="metric-label">Total de Productos Registrados</span>
          <span className="metric-value">{totalProducts}</span>
          <span className="metric-sub"><Package size={14} /> Catálogo de refacciones</span>
        </div>

        <div className="metric-card gold">
          <span className="metric-label">Valor Total del Inventario</span>
          <span className="metric-value" style={{ color: '#d4af37' }}>{formatMXN(totalStockValue)}</span>
          <span className="metric-sub"><DollarSign size={14} /> Costo total en almacén (MXN)</span>
        </div>

        <div className="metric-card danger">
          <span className="metric-label">Productos en Stock Bajo</span>
          <span className="metric-value" style={{ color: '#ef4444' }}>{lowStockProducts.length}</span>
          <span className="metric-sub"><AlertTriangle size={14} /> Por debajo del mínimo</span>
        </div>

        <div className="metric-card warning">
          <span className="metric-label">Productos Agotados</span>
          <span className="metric-value" style={{ color: '#f59e0b' }}>{outOfStockProducts.length}</span>
          <span className="metric-sub"><AlertCircle size={14} /> Existencia 0 unidades</span>
        </div>
      </div>

      {/* Monthly Chart and Most Used Parts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* SVG Chart */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Movimientos por Mes (Entradas vs Salidas)
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--color-secondary)', borderRadius: '50%' }}></span> Entradas
              </span>
              <span style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }}></span> Salidas
              </span>
            </div>
          </div>

          <div style={{ height: '200px', width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
              {/* Grid lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" />

              {/* Bars */}
              {monthlyData.map((d, index) => {
                const x = 55 + index * 70;
                const hEntradas = (d.entradas / maxChartValue) * 130;
                const hSalidas = (d.salidas / maxChartValue) * 130;

                return (
                  <g key={d.month}>
                    {/* Entradas bar */}
                    <g>
                      <title>Entradas: {d.entradas} piezas</title>
                      <rect
                        x={x}
                        y={170 - hEntradas}
                        width="16"
                        height={hEntradas}
                        fill="var(--color-secondary)"
                        rx="4"
                      />
                      {d.entradas > 0 && (
                        <text x={x + 8} y={166 - hEntradas} fontSize="9" fill="var(--color-secondary)" textAnchor="middle" fontWeight="700">
                          {d.entradas}
                        </text>
                      )}
                    </g>
                    {/* Salidas bar */}
                    <g>
                      <title>Salidas: {d.salidas} piezas</title>
                      <rect
                        x={x + 20}
                        y={170 - hSalidas}
                        width="16"
                        height={hSalidas}
                        fill="var(--color-primary)"
                        rx="4"
                      />
                      {d.salidas > 0 && (
                        <text x={x + 28} y={166 - hSalidas} fontSize="9" fill="var(--color-primary)" textAnchor="middle" fontWeight="700">
                          {d.salidas}
                        </text>
                      )}
                    </g>
                    <text x={x + 18} y="190" fontSize="11" fill="var(--color-text-muted)" textAnchor="middle" fontWeight="600">
                      {d.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Most Used Spare Parts Card */}
        <div className="content-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>
            Refacciones Más Utilizadas (Taller)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mostUsedParts.length > 0 ? (
              mostUsedParts.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg-card-hover)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: 'var(--color-primary)',
                      color: 'var(--color-text-main)',
                      fontWeight: 800,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem'
                    }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Consumo acumulado en flota</div>
                    </div>
                  </div>
                  <span className="badge badge-gold">{item.qty} unids</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sin registro de salidas previas</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Purchases and Exits tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Recent Purchases */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} style={{ color: 'var(--color-secondary)' }} /> Entradas Recientes
            </h3>
            <button className="btn btn-outline btn-sm" onClick={() => setCurrentView('compras')}>
              Ver Todas
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total MXN</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((p) => (
                  <tr key={p.id}>
                    <td><span className="badge badge-gold">{p.folio}</span></td>
                    <td>{p.date}</td>
                    <td>{p.supplierName}</td>
                    <td style={{ fontWeight: 700 }}>{formatMXN(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Exits */}
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpRight size={18} style={{ color: 'var(--color-primary)' }} /> Salidas Recientes
            </h3>
            <button className="btn btn-outline btn-sm" onClick={() => setCurrentView('salidas')}>
              Ver Todas
            </button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Unidad</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {recentExits.map((e) => (
                  <tr key={e.id}>
                    <td><span className="badge badge-dark">{e.folio}</span></td>
                    <td>{e.date}</td>
                    <td>{e.reason}</td>
                    <td>{e.economicNumber || '-'}</td>
                    <td style={{ fontWeight: 700 }}>{formatMXN(e.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
