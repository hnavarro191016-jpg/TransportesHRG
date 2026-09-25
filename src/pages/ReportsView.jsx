import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileBarChart, Download, Printer, Filter, Calendar } from 'lucide-react';

export const ReportsView = () => {
  const { data, formatMXN } = useApp();

  const [activeReport, setActiveReport] = useState('inv_almacen');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isDateInRange = (dateStr) => {
    if (!dateStr) return true;
    const d = dateStr.split('T')[0]; // Extract YYYY-MM-DD
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  const filteredKardex = data.kardex.filter(k => isDateInRange(k.dateTime));
  const filteredExits = data.exits.filter(e => isDateInRange(e.date));
  const filteredPurchases = data.purchases.filter(p => isDateInRange(p.date));

  const [selectedWh, setSelectedWh] = useState('');
  const [selectedProd, setSelectedProd] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  const reportTypes = [
    { id: 'inv_almacen', title: '1. Inventario Actual por Almacén' },
    { id: 'stock_bajo', title: '2. Productos con Stock Bajo o Agotado' },
    { id: 'kardex_prod', title: '3. Kardex por Producto' },
    { id: 'entradas_salidas', title: '4. Entradas y Salidas por Periodo' },
    { id: 'compras_prov', title: '5. Compras por Proveedor' },
    { id: 'mas_usadas', title: '6. Refacciones Más Utilizadas' },
    { id: 'gasto_unidad', title: '7. Gasto de Refacciones por Unidad' },
    { id: 'historial_trailer', title: '8. Historial de Refacciones por Tráiler' },
    { id: 'valor_total', title: '9. Valor Total del Inventario' }
  ];

  // Helper to trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  // Helper to export CSV
  const handleExportCSV = () => {
    let rows = [];
    let filename = `reporte_${activeReport}.csv`;

    if (activeReport === 'inv_almacen' || activeReport === 'valor_total') {
      rows.push(['Codigo', 'Nombre', 'Categoria', 'Stock', 'Costo Unitario MXN', 'Valor Total MXN', 'Almacen']);
      data.products.forEach((p) => {
        rows.push([
          p.codeInternal,
          `"${p.name}"`,
          p.category,
          p.currentStock,
          p.unitCost,
          p.currentStock * p.unitCost,
          `"${p.warehouse}"`
        ]);
      });
    } else if (activeReport === 'stock_bajo') {
      rows.push(['Codigo', 'Nombre', 'Stock Actual', 'Stock Minimo', 'Estado Stock', 'Almacen']);
      data.products
        .filter((p) => p.currentStock <= p.minStock)
        .forEach((p) => {
          rows.push([
            p.codeInternal,
            `"${p.name}"`,
            p.currentStock,
            p.minStock,
            p.currentStock === 0 ? 'AGOTADO' : 'STOCK BAJO',
            `"${p.warehouse}"`
          ]);
        });
    } else if (activeReport === 'gasto_unidad' || activeReport === 'historial_trailer') {
      rows.push(['Economico', 'Folio Salida', 'Fecha', 'Refacciones', 'Costo Total MXN']);
      filteredExits
        .filter((e) => e.economicNumber)
        .forEach((e) => {
          rows.push([
            e.economicNumber,
            e.folio,
            e.date,
            `"${e.items.map((i) => i.productName).join('; ')}"`,
            e.totalCost
          ]);
        });
    } else {
      rows.push(['Folio', 'Fecha', 'Tipo Movimiento', 'Producto', 'Cantidad', 'Costo']);
      filteredKardex.forEach((k) => {
        rows.push([k.folio, k.dateTime, k.type, `"${k.productName}"`, k.qtyIn || k.qtyOut, k.unitCost]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalInventoryValue = data.products.reduce((acc, p) => acc + p.currentStock * p.unitCost, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileBarChart size={24} style={{ color: '#d4af37' }} /> Reportes Ejecutivos e Impresión
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Generación de reportes de almacén, valorización, compras por proveedor y gastos por unidad
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-dark" onClick={handleExportCSV}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-gold" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Reporte
          </button>
        </div>
      </div>

      {/* Report Selector Grid */}
      <div className="content-card no-print">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Selecciona el reporte que deseas generar:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {reportTypes.map((rt) => (
            <button
              key={rt.id}
              onClick={() => { setActiveReport(rt.id); setReportModalOpen(true); }}
              className="btn btn-outline"
              style={{ textAlign: 'left', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: '50%', display: 'flex', color: 'var(--color-primary)' }}>
                <FileBarChart size={18} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{rt.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* REPORT MODAL (VENTANA EMERGENTE) */}
      {reportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1200px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header no-print">
              <h3 className="modal-title">Vista Previa de Reporte</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {!['inv_almacen', 'valor_total', 'stock_bajo'].includes(activeReport) && (
                  <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '16px', borderRight: '1px solid var(--color-border)', paddingRight: '16px' }}>
                    <span style={{fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>Filtrar:</span>
                    <input type="date" className="input-field" style={{padding: '4px 8px', fontSize: '0.8rem', width: 'auto'}} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span style={{fontSize: '0.8rem'}}>a</span>
                    <input type="date" className="input-field" style={{padding: '4px 8px', fontSize: '0.8rem', width: 'auto'}} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                )}
                <button className="btn btn-dark btn-sm" onClick={handleExportCSV}>
                  <Download size={14} /> Exportar
                </button>
                <button className="btn btn-gold btn-sm" onClick={handlePrint}>
                  <Printer size={14} /> Imprimir
                </button>
                <button onClick={() => setReportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginLeft: '10px' }}>
                  X
                </button>
              </div>
            </div>
            
            <div className="modal-body print-area" style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#fff' }}>
              {/* Printable Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src="/logo.jpg" alt="Transportes Romo Logo" style={{ height: '60px', objectFit: 'contain' }} />
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Transportes Romo | Control de Inventario
                    </h1>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2563eb', marginTop: '4px', margin: 0 }}>
                      {reportTypes.find((r) => r.id === activeReport)?.title}
                    </h3>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                  <div><strong>Fecha Emisión:</strong> {new Date().toLocaleDateString('es-MX')}</div>
                  <div><strong>Moneda:</strong> Pesos Mexicanos (MXN)</div>
                </div>
              </div>

        {/* REPORT 1 & 9: CURRENT INVENTORY / TOTAL VALUE */}
        {(activeReport === 'inv_almacen' || activeReport === 'valor_total') && (
          <div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>REFACCIONES REGISTRADAS</span>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text-main)' }}>{data.products.length} productos</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>VALOR TOTAL DEL INVENTARIO</span>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#d4af37' }}>{formatMXN(totalInventoryValue)}</div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Refacción / Pieza</th>
                    <th>Categoría</th>
                    <th>Almacén</th>
                    <th>Stock Actual</th>
                    <th>Costo Unit.</th>
                    <th>Valor Total MXN</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.id}>
                      <td><span className="badge badge-dark">{p.codeInternal}</span></td>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.warehouse}</td>
                      <td style={{ fontWeight: 700 }}>{p.currentStock} {p.unitOfMeasure}</td>
                      <td>{formatMXN(p.unitCost)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{formatMXN(p.currentStock * p.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT 2: LOW & OUT OF STOCK */}
        {activeReport === 'stock_bajo' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Refacción</th>
                  <th>Categoría / Marca</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Almacén</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.products
                  .filter((p) => p.currentStock <= p.minStock)
                  .map((p) => (
                    <tr key={p.id}>
                      <td><span className="badge badge-gold">{p.codeInternal}</span></td>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td>{p.category} ({p.brand})</td>
                      <td style={{ fontWeight: 800, color: p.currentStock === 0 ? '#ef4444' : '#f59e0b' }}>
                        {p.currentStock} {p.unitOfMeasure}
                      </td>
                      <td>{p.minStock}</td>
                      <td>{p.warehouse}</td>
                      <td>
                        {p.currentStock === 0 ? (
                          <span className="badge badge-danger">AGOTADO</span>
                        ) : (
                          <span className="badge badge-warning">STOCK BAJO</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 5: PURCHASES BY SUPPLIER */}
        {activeReport === 'compras_prov' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>RFC</th>
                  <th>Facturas / Entradas</th>
                  <th>Total Comprado MXN</th>
                </tr>
              </thead>
              <tbody>
                {data.suppliers.map((s) => {
                  const sPurchases = filteredPurchases.filter((p) => p.supplierId === s.id);
                  const totalAmt = sPurchases.reduce((acc, p) => acc + p.total, 0);

                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td>{s.rfc}</td>
                      <td><span className="badge badge-info">{sPurchases.length} entradas</span></td>
                      <td style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{formatMXN(totalAmt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 7 & 8: EXPENSE PER UNIT / TRAILER HISTORY */}
        {(activeReport === 'gasto_unidad' || activeReport === 'historial_trailer') && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Num. Económico</th>
                  <th>Tipo y Modelo</th>
                  <th>Placas</th>
                  <th>Salidas Asignadas</th>
                  <th>Gasto Total Refacciones</th>
                </tr>
              </thead>
              <tbody>
                {data.units.map((u) => {
                  const uExits = filteredExits.filter((e) => e.economicNumber === u.economicNumber || e.unitId === u.id);
                  const totalSpent = uExits.reduce((acc, e) => acc + e.totalCost, 0);

                  return (
                    <tr key={u.id}>
                      <td><span className="badge badge-gold">{u.economicNumber}</span></td>
                      <td>{u.unitType} - {u.brand} {u.model}</td>
                      <td style={{ fontWeight: 700 }}>{u.plates}</td>
                      <td><span className="badge badge-dark">{uExits.length} salidas</span></td>
                      <td style={{ fontWeight: 800, color: '#2563eb' }}>{formatMXN(totalSpent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* OTHER REPORTS (DEFAULT KARDEX SUMMARY) */}
        {!['inv_almacen', 'valor_total', 'stock_bajo', 'compras_prov', 'gasto_unidad', 'historial_trailer'].includes(activeReport) && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Folio</th>
                  <th>Refacción</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Costo Unit.</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {filteredKardex.map((k) => (
                  <tr key={k.id}>
                    <td>{k.dateTime}</td>
                    <td><span className="badge badge-gold">{k.folio}</span></td>
                    <td style={{ fontWeight: 700 }}>{k.productName}</td>
                    <td><span className="badge badge-info">{k.type}</span></td>
                    <td>{k.qtyIn || k.qtyOut}</td>
                    <td>{formatMXN(k.unitCost)}</td>
                    <td>{k.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
