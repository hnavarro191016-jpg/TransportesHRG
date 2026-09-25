import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';

export const KardexView = ({ globalSearch }) => {
  const { data, formatMXN } = useApp();

  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');

  const filteredKardex = data.kardex.filter((k) => {
    const query = (search || globalSearch).toLowerCase();
    const matchesSearch =
      k.folio.toLowerCase().includes(query) ||
      k.productCode.toLowerCase().includes(query) ||
      k.productName.toLowerCase().includes(query) ||
      k.notes.toLowerCase().includes(query);

    const matchesProd = productFilter ? k.productId === productFilter : true;
    const matchesType = typeFilter ? k.type === typeFilter : true;
    const matchesWh = warehouseFilter ? k.warehouse === warehouseFilter : true;
    const matchesUnit = unitFilter ? k.unitRelated === unitFilter : true;

    return matchesSearch && matchesProd && matchesType && matchesWh && matchesUnit;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={24} style={{ color: '#d4af37' }} /> Kardex Inmutable de Movimientos
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Historial oficial de auditoría. Los registros confirmados no pueden editarse ni eliminarse.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 14px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
          <ShieldCheck size={16} /> Registro Incorruptible de Almacén
        </div>
      </div>

      {/* Filters Bar */}
      <div className="dark-card" style={{ padding: '16px 20px', marginBottom: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por folio, código o notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          {/* Type Filter */}
          <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos los Tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="transferencia">Transferencia</option>
            <option value="devolución">Devolución</option>
          </select>

          {/* Warehouse Filter */}
          <select className="form-control" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="">Todos los Almacenes</option>
            {data.warehouses.map((w) => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>

          {/* Product Filter */}
          <select className="form-control" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="">Todas las Refacciones</option>
            {data.products.map((p) => (
              <option key={p.id} value={p.id}>{p.codeInternal} - {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kardex Main Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Folio</th>
                <th>Producto / Refacción</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Stock Resultante</th>
                <th>Costo Unit.</th>
                <th>Almacén</th>
                <th>Unidad</th>
                <th>Usuario</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredKardex.length > 0 ? (
                filteredKardex.map((k) => {
                  let badge = 'badge-info';
                  if (k.type === 'entrada') badge = 'badge-success';
                  if (k.type === 'salida') badge = 'badge-danger';
                  if (k.type === 'ajuste') badge = 'badge-gold';
                  if (k.type === 'transferencia') badge = 'badge-dark';

                  return (
                    <tr key={k.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{k.dateTime}</td>
                      <td><span className="badge badge-gold">{k.folio}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{k.productCode}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>{k.productName}</div>
                      </td>
                      <td><span className={`badge ${badge}`}>{k.type}</span></td>
                      <td style={{ fontWeight: 700, color: '#166534' }}>{k.qtyIn > 0 ? `+${k.qtyIn}` : '-'}</td>
                      <td style={{ fontWeight: 700, color: '#991b1b' }}>{k.qtyOut > 0 ? `-${k.qtyOut}` : '-'}</td>
                      <td style={{ fontWeight: 800, color: '#2563eb' }}>{k.resultingStock}</td>
                      <td>{formatMXN(k.unitCost)}</td>
                      <td style={{ fontSize: '0.8rem' }}>{k.warehouse}</td>
                      <td>{k.unitRelated !== '-' ? <span className="badge badge-dark">{k.unitRelated}</span> : '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{k.user}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '200px' }}>{k.notes}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                    No se encontraron movimientos en el kardex para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
