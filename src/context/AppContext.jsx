import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_DATA } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('romo_inventory_data_v2');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      console.error('Failed loading localStorage', e);
      return INITIAL_DATA;
    }
  });

  const [session, setSession] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('romo_theme') || 'light';
  });
  const [toasts, setToasts] = useState([]);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsSupabaseOnline(true);
      
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchCurrentUser(session.user);
        else setAuthLoading(false);
      });

      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
          fetchCurrentUser(session.user);
        } else {
          setActiveUser(null);
          setActiveRole(null);
          setAuthLoading(false);
        }
      });

      fetchFromSupabase();
      
      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setAuthLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (user) => {
    try {
      const { data: userData, error } = await supabase
        .from('romo_users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userData) {
        setActiveUser(userData);
        setActiveRole(userData.role);
      } else {
        // Los perfiles se crean por trigger y se habilitan desde Administración.
        // Nunca se asignan ni recuperan roles desde el navegador.
        setActiveUser(null);
        setActiveRole(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (email, password) => {
    if (!supabase) throw new Error("Supabase no conectado");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (name, email, password) => {
    if (!supabase) throw new Error("Supabase no conectado");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (authError) throw authError;
    // El trigger de Supabase crea un perfil Pendiente e inactivo. Los roles solo se
    // asignan desde Administración; nunca desde el navegador durante el registro.
    if (authData.session) await supabase.auth.signOut();
    return authData;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('romo_inventory_data_v2', JSON.stringify(data));
      localStorage.setItem('romo_theme', theme);
    } catch (e) {
      console.error('Failed saving to localStorage', e);
    }
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const fetchFromSupabase = async () => {
    if (!supabase) return;
    try {
      const [
        { data: products },
        { data: categories },
        { data: brands },
        { data: warehouses },
        { data: suppliers },
        { data: units },
        { data: purchases },
        { data: exits },
        { data: workOrders },
        { data: transfers },
        { data: physicalAdjustments },
        { data: kardex },
        { data: users },
        { data: employees },
        { data: courses },
        { data: courseAssignments }
      ] = await Promise.all([
        supabase.from('romo_products').select('*'),
        supabase.from('romo_categories').select('*'),
        supabase.from('romo_brands').select('*'),
        supabase.from('romo_warehouses').select('*'),
        supabase.from('romo_suppliers').select('*'),
        supabase.from('romo_units').select('*'),
        supabase.from('romo_purchases').select('*'),
        supabase.from('romo_exits').select('*'),
        supabase.from('romo_work_orders').select('*'),
        supabase.from('romo_transfers').select('*'),
        supabase.from('romo_physical_adjustments').select('*'),
        supabase.from('romo_kardex').select('*'),
        supabase.from('romo_users').select('*'),
        supabase.from('romo_employees').select('*'),
        supabase.from('romo_courses').select('*'),
        supabase.from('romo_course_assignments').select('*')
      ]);

      setData((prev) => ({
        ...prev,
        products: products ? products.map((p) => ({
          id: p.id,
          codeInternal: p.code_internal,
          codeSupplier: p.code_supplier,
          name: p.name,
          description: p.description,
          category: p.category,
          brand: p.brand,
          unitOfMeasure: p.unit_of_measure,
          compatibility: p.compatibility,
          unitCost: Number(p.unit_cost),
          refPrice: Number(p.ref_price),
          currentStock: Number(p.current_stock),
          minStock: Number(p.min_stock),
          maxStock: Number(p.max_stock),
          warehouse: p.warehouse,
          locationDetails: p.location_details,
          photoUrl: p.photo_url,
          status: p.status,
          expirationDate: p.expiration_date
        })) : prev.products,
        categories: categories || prev.categories,
        brands: brands || prev.brands,
        warehouses: warehouses || prev.warehouses,
        suppliers: suppliers || prev.suppliers,
        units: units ? units.map(u => ({
          id: u.id,
          economicNumber: u.economic_number,
          plates: u.plates,
          unitType: u.unit_type,
          brand: u.brand,
          model: u.model,
          year: u.year,
          vin: u.vin,
          status: u.status,
          notes: u.notes
        })) : prev.units,
        purchases: purchases ? purchases.map(pur => ({
          id: pur.id,
          folio: pur.folio,
          date: pur.purchase_date || pur.date,
          supplierId: pur.supplier_id || pur.supplierId,
          supplierName: pur.supplier_name || pur.supplierName,
          invoiceNumber: pur.invoice_number || pur.invoiceNumber,
          warehouse: pur.warehouse,
          responsibleUser: pur.responsible_user || pur.responsibleUser,
          notes: pur.notes,
          items: pur.items || [],
          subtotal: pur.subtotal,
          totalTax: pur.total_tax || pur.totalTax,
          total: pur.total
        })) : prev.purchases,
        exits: exits ? exits.map(e => ({
          id: e.id,
          folio: e.folio,
          date: e.exit_date || e.date,
          reason: e.reason,
          unitId: e.unit_id || e.unitId,
          economicNumber: e.economic_number || e.economicNumber,
          workOrderId: e.work_order_id || e.workOrderId,
          workOrderFolio: e.work_order_folio || e.workOrderFolio,
          warehouse: e.warehouse,
          responsibleUser: e.responsible_user || e.responsibleUser,
          notes: e.notes,
          items: e.items || [],
          totalCost: e.total_cost || e.totalCost
        })) : prev.exits,
        workOrders: workOrders ? workOrders.map(w => ({
          id: w.id,
          folio: w.folio,
          openDate: w.open_date || w.openDate,
          unitId: w.unit_id || w.unitId,
          economicNumber: w.economic_number || w.economicNumber,
          type: w.maintenance_type || w.type,
          issueDescription: w.issue_description || w.issueDescription,
          technician: w.technician,
          partsUsed: w.parts_used || w.partsUsed || [],
          status: w.status,
          closeDate: w.close_date || w.closeDate,
          totalCost: w.total_cost || w.totalCost,
          notes: w.notes
        })) : prev.workOrders,
        transfers: transfers ? transfers.map(t => ({
          id: t.id,
          folio: t.folio,
          date: t.transfer_date || t.date,
          originWarehouse: t.origin_warehouse || t.originWarehouse,
          destinationWarehouse: t.destination_warehouse || t.destinationWarehouse,
          responsibleUser: t.responsible_user || t.responsibleUser,
          notes: t.notes,
          items: t.items || []
        })) : prev.transfers,
        physicalAdjustments: physicalAdjustments ? physicalAdjustments.map(a => ({
          id: a.id,
          folio: a.folio,
          date: a.adjustment_date || a.date,
          warehouse: a.warehouse,
          responsibleUser: a.responsible_user || a.responsibleUser,
          reason: a.reason,
          notes: a.notes,
          items: a.items || []
        })) : prev.physicalAdjustments,
        kardex: kardex ? kardex.map(k => ({
          id: k.id,
          dateTime: k.date_time || k.dateTime,
          folio: k.folio,
          productId: k.product_id || k.productId,
          productCode: k.product_code || k.productCode,
          productName: k.product_name || k.productName,
          type: k.movement_type || k.type,
          qtyIn: k.qty_in || k.qtyIn,
          qtyOut: k.qty_out || k.qtyOut,
          resultingStock: k.resulting_stock || k.resultingStock,
          unitCost: k.unit_cost || k.unitCost,
          warehouse: k.warehouse,
          unitRelated: k.unit_related || k.unitRelated,
          user: k.user_name || k.user,
          notes: k.notes
        })) : prev.kardex,
        users: users || [],
        employees: employees ? employees.map(e => ({
          id: e.id,
          firstName: e.first_name,
          lastName: e.last_name,
          department: e.department,
          position: e.position,
          curp: e.curp,
          rfc: e.rfc,
          nss: e.nss,
          hireDate: e.hire_date,
          bloodType: e.blood_type,
          emergencyContact: e.emergency_contact,
          emergencyPhone: e.emergency_phone,
          licenseNumber: e.license_number,
          licenseExpiry: e.license_expiry,
          status: e.status
        })) : [],
        courses: courses ? courses.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          coverImageUrl: c.cover_image_url,
          category: c.category,
          profile: c.profile,
          durationMinutes: c.duration_minutes,
          minScoreRequired: c.min_score_required,
          maxAttempts: c.max_attempts,
          validityMonths: c.validity_months,
          status: c.status
        })) : [],
        courseAssignments: courseAssignments ? courseAssignments.map(ca => ({
          id: ca.id,
          userId: ca.user_id,
          courseId: ca.course_id,
          status: ca.status,
          assignedDate: ca.assigned_date,
          dueDate: ca.due_date,
          completionDate: ca.completion_date,
          expirationDate: ca.expiration_date,
          finalScore: ca.score
        })) : []
      }));
      addToast('Datos sincronizados con Supabase', 'info');
    } catch (err) {
      console.warn('Could not sync from Supabase, using local state:', err);
    }
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const resetDemoData = () => {
    setData(INITIAL_DATA);
    addToast('Datos de demostración restablecidos correctamente', 'warning');
  };

  const formatMXN = (amount) => {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(val);
  };

  const generateFolio = (prefix, list) => {
    const nextNum = list.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}-${padded}`;
  };

  const commitInventoryMovement = async (kind, document) => {
    if (!supabase) return true;
    const { error } = await supabase.rpc('record_inventory_movement', {
      p_kind: kind,
      p_document: document,
      p_items: document.items
    });
    if (error) {
      addToast(`No se registró el movimiento: ${error.message}`, 'danger');
      return false;
    }
    return true;
  };

  /* ------------------- MUTATIONS WITH SUPABASE SYNC ------------------- */

  const addProduct = async (prod) => {
    const newProd = {
      ...prod,
      id: `prod-${Date.now()}`,
      currentStock: Math.max(0, Number(prod.currentStock) || 0),
      minStock: Number(prod.minStock) || 0,
      maxStock: Number(prod.maxStock) || 0,
      unitCost: Number(prod.unitCost) || 0,
      refPrice: Number(prod.refPrice) || 0,
      status: prod.status || 'activo'
    };

    setData((prev) => ({
      ...prev,
      products: [newProd, ...prev.products]
    }));

    if (supabase) {
      await supabase.from('romo_products').insert([{
        id: newProd.id,
        code_internal: newProd.codeInternal,
        code_supplier: newProd.codeSupplier,
        name: newProd.name,
        description: newProd.description,
        category: newProd.category,
        brand: newProd.brand,
        unit_of_measure: newProd.unitOfMeasure,
        compatibility: newProd.compatibility,
        unit_cost: newProd.unitCost,
        ref_price: newProd.refPrice,
        current_stock: newProd.currentStock,
        min_stock: newProd.minStock,
        max_stock: newProd.maxStock,
        warehouse: newProd.warehouse,
        location_details: newProd.locationDetails,
        photo_url: newProd.photoUrl,
        status: newProd.status,
        expiration_date: newProd.expirationDate
      }]);
    }

    addToast(`Producto "${newProd.name}" registrado exitosamente`);
    return newProd;
  };

  const updateUser = async (id, updates) => {
    if (!supabase) return false;
    const { error } = await supabase.from('romo_users').update(updates).eq('id', id);
    if (!error) {
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => u.id === id ? { ...u, ...updates } : u)
      }));
      addToast('Usuario actualizado correctamente');
      return true;
    }
    return false;
  };

  const updateProduct = async (updatedProd) => {
    if (Number(updatedProd.currentStock) < 0) {
      addToast('No se permite stock negativo', 'danger');
      return false;
    }
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p))
    }));

    if (supabase) {
      await supabase.from('romo_products').update({
        code_internal: updatedProd.codeInternal,
        code_supplier: updatedProd.codeSupplier,
        name: updatedProd.name,
        description: updatedProd.description,
        category: updatedProd.category,
        brand: updatedProd.brand,
        unit_of_measure: updatedProd.unitOfMeasure,
        compatibility: updatedProd.compatibility,
        unit_cost: updatedProd.unitCost,
        ref_price: updatedProd.refPrice,
        current_stock: updatedProd.currentStock,
        min_stock: updatedProd.minStock,
        max_stock: updatedProd.maxStock,
        warehouse: updatedProd.warehouse,
        location_details: updatedProd.locationDetails,
        status: updatedProd.status
      }).eq('id', updatedProd.id);
    }

    addToast(`Producto "${updatedProd.name}" actualizado`);
    return true;
  };

  const toggleProductStatus = async (id) => {
    let newStatus = 'activo';
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === id) {
          newStatus = p.status === 'activo' ? 'inactivo' : 'activo';
          return { ...p, status: newStatus };
        }
        return p;
      })
    }));

    if (supabase) {
      await supabase.from('romo_products').update({ status: newStatus }).eq('id', id);
    }

    addToast('Estado de producto actualizado');
  };

  const addCategory = async (cat) => {
    const newCat = { ...cat, id: `cat-${Date.now()}` };
    setData((prev) => ({ ...prev, categories: [...prev.categories, newCat] }));
    if (supabase) await supabase.from('romo_categories').insert([newCat]);
    addToast(`Categoría "${newCat.name}" agregada`);
  };

  const addBrand = async (brand) => {
    const newBrand = { ...brand, id: `b-${Date.now()}` };
    setData((prev) => ({ ...prev, brands: [...prev.brands, newBrand] }));
    if (supabase) await supabase.from('romo_brands').insert([newBrand]);
    addToast(`Marca "${newBrand.name}" agregada`);
  };

  const addWarehouse = async (wh) => {
    const newWh = { ...wh, id: `wh-${Date.now()}` };
    setData((prev) => ({ ...prev, warehouses: [...prev.warehouses, newWh] }));
    if (supabase) await supabase.from('romo_warehouses').insert([newWh]);
    addToast(`Almacén "${newWh.name}" creado`);
  };

  const addSupplier = async (sup) => {
    const newSup = { ...sup, id: `sup-${Date.now()}`, status: 'activo' };
    setData((prev) => ({ ...prev, suppliers: [newSup, ...prev.suppliers] }));
    if (supabase) {
      await supabase.from('romo_suppliers').insert([{
        id: newSup.id,
        name: newSup.name,
        rfc: newSup.rfc,
        contact: newSup.contact,
        phone: newSup.phone,
        email: newSup.email,
        address: newSup.address,
        payment_terms: newSup.paymentTerms,
        status: newSup.status
      }]);
    }
    addToast(`Proveedor "${newSup.name}" registrado`);
  };

  const addUnit = async (unit) => {
    const newUnit = { ...unit, id: `u-${Date.now()}`, status: unit.status || 'activo' };
    setData((prev) => ({ ...prev, units: [newUnit, ...prev.units] }));
    if (supabase) {
      await supabase.from('romo_units').insert([{
        id: newUnit.id,
        economic_number: newUnit.economicNumber,
        plates: newUnit.plates,
        unit_type: newUnit.unitType,
        brand: newUnit.brand,
        model: newUnit.model,
        year: newUnit.year,
        vin: newUnit.vin,
        status: newUnit.status,
        notes: newUnit.notes
      }]);
    }
    addToast(`Unidad "${newUnit.economicNumber}" registrada`);
  };

  const updateUnit = async (unit) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((u) => (u.id === unit.id ? { ...u, ...unit } : u))
    }));
    if (supabase) {
      await supabase.from('romo_units').update({
        economic_number: unit.economicNumber,
        plates: unit.plates,
        unit_type: unit.unitType,
        brand: unit.brand,
        model: unit.model,
        year: unit.year,
        vin: unit.vin,
        status: unit.status,
        notes: unit.notes
      }).eq('id', unit.id);
    }
    addToast(`Unidad "${unit.economicNumber}" actualizada`);
  };

  const addPurchase = async (purchaseData) => {
    if (!purchaseData.items || purchaseData.items.length === 0) {
      addToast('No se puede guardar una entrada sin al menos un producto', 'danger');
      return false;
    }

    const folio = generateFolio('ENT', data.purchases);
    const now = new Date();
    const dateTimeStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newPurchase = {
      ...purchaseData,
      id: `pur-${Date.now()}`,
      folio,
      date: purchaseData.date || now.toISOString().substring(0, 10)
    };

    const updatedProducts = [...data.products];
    const newKardexEntries = [];

    newPurchase.items.forEach((item) => {
      const idx = updatedProducts.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        const p = updatedProducts[idx];
        const newStock = Number(p.currentStock) + Number(item.qty);
        updatedProducts[idx] = {
          ...p,
          currentStock: newStock,
          unitCost: Number(item.unitCost) || p.unitCost
        };

        newKardexEntries.push({
          id: `k-${Date.now()}-${Math.random()}`,
          dateTime: dateTimeStr,
          folio,
          productId: p.id,
          productCode: p.codeInternal,
          productName: p.name,
          type: 'entrada',
          qtyIn: Number(item.qty),
          qtyOut: 0,
          resultingStock: newStock,
          unitCost: Number(item.unitCost),
          warehouse: newPurchase.warehouse,
          unitRelated: '-',
          user: activeUser.name,
          notes: `Entrada por compra Factura ${newPurchase.invoiceNumber || 'S/N'}`
        });
      }
    });

    if (!(await commitInventoryMovement('purchase', newPurchase))) return false;

    setData((prev) => ({
      ...prev,
      purchases: [newPurchase, ...prev.purchases],
      products: updatedProducts,
      kardex: [...newKardexEntries, ...prev.kardex]
    }));

    addToast(`Entrada por compra ${folio} registrada correctamente`);
    return true;
  };

  const addExit = async (exitData) => {
    if (!exitData.items || exitData.items.length === 0) {
      addToast('Debe agregar al menos un producto a la salida', 'danger');
      return false;
    }

    const updatedProducts = [...data.products];
    for (const item of exitData.items) {
      const p = updatedProducts.find((prod) => prod.id === item.productId);
      if (!p) {
        addToast(`Producto no encontrado en inventario`, 'danger');
        return false;
      }
      if (p.currentStock < Number(item.qty)) {
        addToast(`Stock insuficiente para "${p.name}". Disponible: ${p.currentStock}, Solicitado: ${item.qty}`, 'danger');
        return false;
      }
    }

    const folio = generateFolio('SAL', data.exits);
    const now = new Date();
    const dateTimeStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newExit = {
      ...exitData,
      id: `ext-${Date.now()}`,
      folio,
      date: exitData.date || now.toISOString().substring(0, 10)
    };

    const newKardexEntries = [];

    exitData.items.forEach((item) => {
      const idx = updatedProducts.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        const p = updatedProducts[idx];
        const newStock = Number(p.currentStock) - Number(item.qty);
        updatedProducts[idx] = {
          ...p,
          currentStock: newStock
        };

        newKardexEntries.push({
          id: `k-${Date.now()}-${Math.random()}`,
          dateTime: dateTimeStr,
          folio,
          productId: p.id,
          productCode: p.codeInternal,
          productName: p.name,
          type: 'salida',
          qtyIn: 0,
          qtyOut: Number(item.qty),
          resultingStock: newStock,
          unitCost: Number(item.unitCost || p.unitCost),
          warehouse: newExit.warehouse,
          unitRelated: newExit.economicNumber || '-',
          user: activeUser.name,
          notes: `Salida por ${newExit.reason} ${newExit.workOrderFolio ? `(OT: ${newExit.workOrderFolio})` : ''}`
        });
      }
    });

    if (!(await commitInventoryMovement('exit', newExit))) return false;

    setData((prev) => ({
      ...prev,
      exits: [newExit, ...prev.exits],
      products: updatedProducts,
      kardex: [...newKardexEntries, ...prev.kardex]
    }));

    addToast(`Salida de inventario ${folio} registrada correctamente`);
    return true;
  };

  const addWorkOrder = async (otData) => {
    const folio = generateFolio('OT', data.workOrders);
    const newOT = {
      ...otData,
      id: `work-${Date.now()}`,
      folio,
      openDate: otData.openDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: otData.status || 'abierta'
    };

    if (otData.partsUsed && otData.partsUsed.length > 0) {
      const exitSuccess = await addExit({
        reason: otData.type === 'preventivo' ? 'Mantenimiento preventivo' : 'Reparación correctiva',
        unitId: otData.unitId,
        economicNumber: otData.economicNumber,
        workOrderId: newOT.id,
        workOrderFolio: folio,
        warehouse: otData.warehouse || 'Almacén Taller Central',
        responsibleUser: otData.technician || activeUser.name,
        notes: `Refacciones asignadas a la Orden de Trabajo ${folio}`,
        items: otData.partsUsed.map((p) => ({
          productId: p.productId,
          productCode: p.productCode,
          productName: p.name,
          qty: p.qty,
          unitCost: p.unitCost
        }))
      });

      if (!exitSuccess) return false;
    }

    setData((prev) => ({
      ...prev,
      workOrders: [newOT, ...prev.workOrders]
    }));

    if (supabase) {
      await supabase.from('romo_work_orders').insert([{
        id: newOT.id,
        folio: newOT.folio,
        unit_id: newOT.unitId,
        economic_number: newOT.economicNumber,
        unit_info: newOT.unitInfo,
        maintenance_type: newOT.type,
        issue_description: newOT.issueDescription,
        diagnosis: newOT.diagnosis,
        technician: newOT.technician,
        status: newOT.status,
        open_date: newOT.openDate,
        close_date: newOT.closeDate,
        parts_used: newOT.partsUsed,
        labor_cost: newOT.laborCost,
        total_cost: newOT.totalCost
      }]);
    }

    addToast(`Orden de Trabajo ${folio} registrada`);
    return true;
  };

  const updateWorkOrderStatus = async (id, status, closeDate = '') => {
    const closedStr = status === 'terminada' ? (closeDate || new Date().toISOString().replace('T', ' ').substring(0, 16)) : '';
    setData((prev) => ({
      ...prev,
      workOrders: prev.workOrders.map((w) =>
        w.id === id ? { ...w, status, closeDate: closedStr } : w
      )
    }));

    if (supabase) {
      await supabase.from('romo_work_orders').update({
        status,
        close_date: closedStr
      }).eq('id', id);
    }

    addToast(`Orden de trabajo actualizada a "${status}"`);
  };

  const addTransfer = async (trData) => {
    if (!trData.items || trData.items.length === 0) {
      addToast('Debe incluir productos en la transferencia', 'danger');
      return false;
    }

    const folio = generateFolio('TR', data.transfers);
    const now = new Date();
    const dateTimeStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newTransfer = {
      ...trData,
      id: `tr-${Date.now()}`,
      folio,
      date: trData.date || now.toISOString().substring(0, 10)
    };

    const newKardexEntries = [];
    trData.items.forEach((item) => {
      const p = data.products.find((prod) => prod.id === item.productId);
      if (p) {
        newKardexEntries.push({
          id: `k-tr1-${Date.now()}-${Math.random()}`,
          dateTime: dateTimeStr,
          folio,
          productId: p.id,
          productCode: p.codeInternal,
          productName: p.name,
          type: 'transferencia',
          qtyIn: 0,
          qtyOut: Number(item.qty),
          resultingStock: p.currentStock,
          unitCost: p.unitCost,
          warehouse: trData.originWarehouse,
          unitRelated: '-',
          user: activeUser.name,
          notes: `Salida por transferencia a ${trData.destinationWarehouse}`
        });

        newKardexEntries.push({
          id: `k-tr2-${Date.now()}-${Math.random()}`,
          dateTime: dateTimeStr,
          folio,
          productId: p.id,
          productCode: p.codeInternal,
          productName: p.name,
          type: 'transferencia',
          qtyIn: Number(item.qty),
          qtyOut: 0,
          resultingStock: p.currentStock,
          unitCost: p.unitCost,
          warehouse: trData.destinationWarehouse,
          unitRelated: '-',
          user: activeUser.name,
          notes: `Entrada por transferencia desde ${trData.originWarehouse}`
        });
      }
    });

    if (!(await commitInventoryMovement('transfer', newTransfer))) return false;

    setData((prev) => ({
      ...prev,
      transfers: [newTransfer, ...prev.transfers],
      kardex: [...newKardexEntries, ...prev.kardex]
    }));

    addToast(`Transferencia ${folio} registrada entre almacenes`);
    return true;
  };

  const addAdjustment = async (adjData) => {
    const folio = generateFolio('AJ', data.physicalAdjustments);
    const now = new Date();
    const dateTimeStr = now.toISOString().replace('T', ' ').substring(0, 16);

    const newAdj = {
      ...adjData,
      id: `adj-${Date.now()}`,
      folio,
      date: adjData.date || now.toISOString().substring(0, 10)
    };

    const updatedProducts = [...data.products];
    const newKardexEntries = [];

    adjData.items.forEach((item) => {
      const idx = updatedProducts.findIndex((p) => p.id === item.productId);
      if (idx !== -1) {
        const p = updatedProducts[idx];
        const newStock = Number(item.adjustedQty);
        const diff = newStock - p.currentStock;

        updatedProducts[idx] = {
          ...p,
          currentStock: newStock
        };

        newKardexEntries.push({
          id: `k-adj-${Date.now()}-${Math.random()}`,
          dateTime: dateTimeStr,
          folio,
          productId: p.id,
          productCode: p.codeInternal,
          productName: p.name,
          type: 'ajuste',
          qtyIn: diff > 0 ? diff : 0,
          qtyOut: diff < 0 ? Math.abs(diff) : 0,
          resultingStock: newStock,
          unitCost: p.unitCost,
          warehouse: adjData.warehouse,
          unitRelated: '-',
          user: activeUser.name,
          notes: `Ajuste físico: ${adjData.reason} (Dif: ${diff > 0 ? '+' + diff : diff})`
        });
      }
    });

    if (!(await commitInventoryMovement('adjustment', newAdj))) return false;

    setData((prev) => ({
      ...prev,
      physicalAdjustments: [newAdj, ...prev.physicalAdjustments],
      products: updatedProducts,
      kardex: [...newKardexEntries, ...prev.kardex]
    }));

    addToast(`Ajuste de inventario ${folio} aplicado`);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        session,
        authLoading,
        login,
        register,
        logout,
        data,
        setData,
        activeRole,
        setActiveRole,
        activeUser,
        setActiveUser,
        theme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
        resetDemoData,
        formatMXN,
        isSupabaseOnline,
        fetchFromSupabase,
        updateUser,
        addProduct,
        updateProduct,
        toggleProductStatus,
        addCategory,
        addBrand,
        addWarehouse,
        addSupplier,
        addUnit,
        updateUnit,
        addPurchase,
        addExit,
        addWorkOrder,
        updateWorkOrderStatus,
        addTransfer,
        addAdjustment
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
