import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Plus, Trash2, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const PurchasesView = () => {
  const { data, formatMXN, activeUser, activeRole } = useApp();

  const [purchasesList, setPurchasesList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const loadPurchases = async () => {
    try {
      const { data: fetchPurchases, error } = await supabase
        .from('romo_purchases')
        .select('*')
        .order('purchase_date', { ascending: false });
      if (!error && fetchPurchases) {
        setPurchasesList(fetchPurchases);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const initialForm = {
    supplierId: data.suppliers[0]?.id || '',
    supplierName: data.suppliers[0]?.name || '',
    invoiceNumber: '',
    warehouse: data.warehouses[0]?.name || 'Almacén Taller Central',
    notes: '',
    items: []
  };

  const [formData, setFormData] = useState(initialForm);

  // New item draft line
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCost, setItemCost] = useState(0);
  const [itemTaxPercent, setItemTaxPercent] = useState(16);

  const canEdit = ['Administrador', 'Encargado de almacén', 'Compras'].includes(activeRole);

  const handleOpenModal = () => {
    setFormData(initialForm);
    if (data.products.length > 0) {
      setSelectedProdId(data.products[0].id);
      setItemCost(data.products[0].unitCost);
    }
    setModalOpen(true);
  };

  const handleProductSelectChange = (id) => {
    setSelectedProdId(id);
    const p = data.products.find((prod) => prod.id === id);
    if (p) setItemCost(p.unitCost);
  };

  const handleAddItem = () => {
    const prod = data.products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    if (itemQty <= 0) {
      alert('La cantidad debe ser mayor a cero');
      return;
    }

    const subtotal = itemQty * itemCost;
    const taxAmount = subtotal * (itemTaxPercent / 100);
    const total = subtotal + taxAmount;

    const newItem = {
      productId: prod.id,
      productCode: prod.codeInternal,
      productName: prod.name,
      qty: Number(itemQty),
      unitCost: Number(itemCost),
      taxPercent: Number(itemTaxPercent),
      subtotal,
      total
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + item.subtotal, 0);
    const totalTax = formData.items.reduce((acc, item) => acc + (item.total - item.subtotal), 0);
    const total = subtotal + totalTax;
    return { subtotal, totalTax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Debes agregar al menos un producto a la entrada');
      return;
    }

    const { subtotal, total } = calculateTotals();

    const purchasePayload = {
      supplier_id: formData.supplierId,
      user_id: activeUser?.id,
      status: 'completado',
      subtotal: subtotal,
      total: total,
      purchase_date: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('romo_purchases').insert([purchasePayload]);
      if (error) {
        console.error('Error insertando compra:', error);
        alert('Error al guardar compra: ' + error.message);
      } else {
        alert('Compra guardada exitosamente.');
        setModalOpen(false);
        loadPurchases(); // Recargar lista
      }
    } catch (err) {
      console.error(err);
      alert('Error en red al guardar');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Compras y Entradas de Inventario
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Reabastecimiento de refacciones, registro de facturas y actualización automática de stock
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={handleOpenModal}>
            <Plus size={18} /> Registrar Nueva Entrada por Compra
          </button>
        )}
      </div>

      {/* Purchases Table */}
      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Num. Factura</th>
                <th>Almacén Destino</th>
                <th>Partidas</th>
                <th>Monto Total MXN</th>
                <th style={{ textAlign: 'right' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {purchasesList.length > 0 ? (
                purchasesList.map((p) => (
                  <tr key={p.id}>
                    <td><span className="badge badge-gold">{p.folio || p.id}</span></td>
                    <td>{p.purchase_date || p.date}</td>
                    <td style={{ fontWeight: 700 }}>{p.supplier_name || p.supplierId || 'Proveedor'}</td>
                    <td>{p.invoice_number || 'S/N'}</td>
                    <td>{p.warehouse || 'N/A'}</td>
                    <td><span className="badge badge-info">{p.items?.length || 0} prods</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>{formatMXN(p.total)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSelectedPurchase(p);
                          setDetailModalOpen(true);
                        }}
                      >
                        <Eye size={14} /> Ver Entrada
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                    No hay entradas registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content dark" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Entrada de Inventario por Compra</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Proveedor *</label>
                    <select
                      className="form-control"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    >
                      {data.suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número de Factura *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. FAC-99420"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Almacén Destino *</label>
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
                </div>

                {/* ADD ITEMS SECTION */}
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: '#d4af37', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>
                    Agregar Refacciones a la Compra
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Producto</label>
                      <select
                        className="form-control"
                        value={selectedProdId}
                        onChange={(e) => handleProductSelectChange(e.target.value)}
                      >
                        {data.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codeInternal} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={itemQty}
                        onChange={(e) => setItemQty(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Costo Unit (MXN)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>IVA %</label>
                      <input
                        type="number"
                        className="form-control"
                        value={itemTaxPercent}
                        onChange={(e) => setItemTaxPercent(e.target.value)}
                      />
                    </div>

                    <button type="button" className="btn btn-gold btn-sm" onClick={handleAddItem}>
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* ITEMS TABLE DRAFT */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Lista de Partidas</h4>
                  {formData.items.length > 0 ? (
                    <div className="table-responsive">
                      <table className="data-table dark">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Costo Unit.</th>
                            <th>Subtotal</th>
                            <th>Total (+IVA)</th>
                            <th>Eliminar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.items.map((it, idx) => (
                            <tr key={idx}>
                              <td>{it.productCode}</td>
                              <td>{it.productName}</td>
                              <td>{it.qty}</td>
                              <td>{formatMXN(it.unitCost)}</td>
                              <td>{formatMXN(it.subtotal)}</td>
                              <td style={{ fontWeight: 700, color: '#d4af37' }}>{formatMXN(it.total)}</td>
                              <td>
                                <button
                                  type="button"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                  onClick={() => handleRemoveItem(idx)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Agrega al menos una refacción arriba.</p>
                  )}
                </div>

                {/* TOTALS SUMMARY */}
                {formData.items.length > 0 && (
                  <div style={{ alignSelf: 'flex-end', textAlign: 'right', background: '#0b0f17', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--color-border)', width: '260px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Subtotal: {formatMXN(calculateTotals().subtotal)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>IVA (16%): {formatMXN(calculateTotals().totalTax)}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d4af37', marginTop: '4px' }}>
                      TOTAL: {formatMXN(calculateTotals().total)}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-gold btn-sm">
                  Confirmar y Guardar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalOpen && selectedPurchase && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Entrada {selectedPurchase.folio}</h3>
              <button onClick={() => setDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                <div><strong>Proveedor:</strong> {selectedPurchase.supplierName}</div>
                <div><strong>Factura:</strong> {selectedPurchase.invoiceNumber}</div>
                <div><strong>Almacén Destino:</strong> {selectedPurchase.warehouse}</div>
                <div><strong>Fecha Entrada:</strong> {selectedPurchase.date}</div>
                <div><strong>Usuario Responsable:</strong> {selectedPurchase.responsibleUser}</div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Partidas Recibidas</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Refacción</th>
                      <th>Cantidad</th>
                      <th>Costo Unit.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.productCode}</td>
                        <td>{it.productName}</td>
                        <td>{it.qty}</td>
                        <td>{formatMXN(it.unitCost)}</td>
                        <td style={{ fontWeight: 700 }}>{formatMXN(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
                Total Entrada: {formatMXN(selectedPurchase.total)}
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
