import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_DATA } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

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

  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
  const STORAGE_KEY_LAST_ACTIVITY = 'romo_last_activity';

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

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsSupabaseOnline(true);
      
      // Get initial session con validación de inactividad de 30 min
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          const lastActivityStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
          const now = Date.now();
          if (lastActivityStr && (now - Number(lastActivityStr)) > INACTIVITY_TIMEOUT_MS) {
            console.warn('Sesión previa expirada por inactividad (>30 minutos).');
            localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
            localStorage.removeItem('activeModule');
            localStorage.removeItem('currentView');
            supabase.auth.signOut().finally(() => {
              setSession(null);
              setActiveUser(null);
              setActiveRole(null);
              setAuthLoading(false);
              addToast('Tu sesión ha expirado por inactividad (30 minutos).', 'warning');
            });
            return;
          }
          localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
          setSession(session);
          fetchCurrentUser(session.user);
        } else {
          localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
          setAuthLoading(false);
        }
      });

      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          const lastActivityStr = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
          const now = Date.now();
          if (event !== 'SIGNED_IN' && lastActivityStr && (now - Number(lastActivityStr)) > INACTIVITY_TIMEOUT_MS) {
            localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
            supabase.auth.signOut();
            return;
          }
          localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
          setSession(session);
          fetchCurrentUser(session.user);
        } else {
          localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
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
        
      const isSuperAdminEmail = 
        user.email?.toLowerCase().includes('hnavarro') || 
        user.email?.toLowerCase() === 'admin@transportesromo.mx' ||
        user.user_metadata?.role === 'Administrador';

      if (userData) {
        if (isSuperAdminEmail && userData.role !== 'Administrador') {
          userData.role = 'Administrador';
          userData.active = true;
          // Actualizar en base de datos para persistir el rol correcto
          supabase.from('romo_users').update({ role: 'Administrador', active: true }).eq('id', user.id).then();
        }
        setActiveUser(userData);
        setActiveRole(userData.role);
      } else {
        const fallbackUser = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0],
          email: user.email,
          role: isSuperAdminEmail ? 'Administrador' : (user.user_metadata?.role || 'Operador'),
          active: true,
          must_change_password: user.user_metadata?.must_change_password || false
        };
        supabase.from('romo_users').upsert([fallbackUser]).then();
        setActiveUser(fallbackUser);
        setActiveRole(fallbackUser.role);
      }
      // Recargar datos desde Supabase con la sesión activa autenticada (para resolver RLS en romo_users)
      fetchFromSupabase();
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (emailOrUser, password) => {
    if (!supabase) throw new Error("Supabase no conectado");
    
    let finalEmail = emailOrUser;
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail.trim().toLowerCase()}@hrg.local`;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
    if (error) throw error;
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, Date.now().toString());
    return data;
  };

  const register = async (name, emailOrUser, password, forcePasswordChange = false, role = 'Operador') => {
    if (!supabase) throw new Error("Supabase no conectado");

    let finalEmail = emailOrUser;
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail.trim().toLowerCase()}@hrg.local`;
    }

    // Usar un cliente temporal sin persistencia para no destruir la sesión del administrador actual
    const tempSupabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email: finalEmail,
      password,
      options: { 
        data: { 
          name, 
          role, 
          must_change_password: forcePasswordChange 
        } 
      }
    });
    
    if (authError) throw authError;
    return authData;
  };

  const logout = async (reason = null) => {
    localStorage.removeItem('activeModule');
    localStorage.removeItem('currentView');
    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error during signOut:', err);
      }
    }
    setSession(null);
    setActiveUser(null);
    setActiveRole(null);
    if (reason === 'inactivity') {
      addToast('Tu sesión ha expirado por inactividad (30 minutos).', 'warning');
    }
  };

  // Monitoreo proactivo de inactividad de 30 minutos mientras la sesión está abierta
  useEffect(() => {
    if (!session) return;

    let lastRecorded = Date.now();
    if (!localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY)) {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, lastRecorded.toString());
    }

    const recordUserActivity = () => {
      const now = Date.now();
      // Throttle de 10 segundos para no saturar localStorage en cada pixel de mouse
      if (now - lastRecorded > 10000) {
        lastRecorded = now;
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
      }
    };

    const userEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    userEvents.forEach((ev) => window.addEventListener(ev, recordUserActivity, { passive: true }));

    // Verificación periódica cada 15 segundos
    const inactivityTimer = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
      const now = Date.now();
      const lastAct = stored ? Number(stored) : lastRecorded;
      if (now - lastAct >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(inactivityTimer);
        logout('inactivity');
      }
    }, 15000);

    return () => {
      userEvents.forEach((ev) => window.removeEventListener(ev, recordUserActivity));
      clearInterval(inactivityTimer);
    };
  }, [session]);

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
      const results = await Promise.all([
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
        supabase.from('romo_course_assignments').select('*'),
        supabase.from('romo_recruitment_vacancies').select('*'),
        supabase.from('romo_recruitment_candidates').select('*'),
        supabase.from('romo_recruitment_followups').select('*'),
        supabase.from('romo_recruitment_history').select('*'),
        supabase.from('romo_recruitment_notifications').select('*')
      ]);

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
        { data: courseAssignments },
        { data: recruitmentVacancies },
        { data: recruitmentCandidates },
        { data: recruitmentFollowups },
        { data: recruitmentHistory },
        { data: recruitmentNotifications }
      ] = results;

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
        })) : [],
        recruitmentVacancies: recruitmentVacancies && recruitmentVacancies.length > 0 ? recruitmentVacancies.map(v => ({
          id: v.id,
          title: v.title,
          department: v.department,
          location: v.location,
          description: v.description,
          requirements: v.requirements,
          scheduleShift: v.schedule_shift,
          slots: Number(v.slots) || 1,
          status: v.status
        })) : prev.recruitmentVacancies || INITIAL_DATA.recruitmentVacancies,
        recruitmentCandidates: recruitmentCandidates && recruitmentCandidates.length > 0 ? recruitmentCandidates.map(c => ({
          id: c.id,
          folio: c.folio,
          vacancyId: c.vacancy_id,
          vacancyTitle: c.vacancy_title,
          fullName: c.full_name,
          phone: c.phone,
          whatsapp: c.whatsapp,
          email: c.email,
          city: c.city,
          municipality: c.municipality,
          neighborhood: c.neighborhood,
          source: c.source,
          sourceDetails: c.source_details,
          secondaryVacancies: c.secondary_vacancies || [],
          entryAvailability: c.entry_availability,
          scheduleAvailability: c.schedule_availability,
          salaryExpectation: Number(c.salary_expectation) || 0,
          salaryPeriod: c.salary_period,
          transportMode: c.transport_mode,
          education: c.education,
          yearsExperience: Number(c.years_experience) || 0,
          employmentHistory: c.employment_history || [],
          skillsCertifications: c.skills_certifications,
          recruiterNotes: c.recruiter_notes,
          specificFields: c.specific_fields || {},
          consentShareProfile: Boolean(c.consent_share_profile),
          consentDate: c.consent_date,
          resumeUrl: c.resume_url,
          status: c.status,
          discardReason: c.discard_reason,
          hireNotes: c.hire_notes,
          assignedRecruiter: c.assigned_recruiter,
          companyReviewer: c.company_reviewer,
          nextAction: c.next_action,
          nextActionDate: c.next_action_date,
          lastActivityAt: c.last_activity_at,
          createdAt: c.created_at
        })) : prev.recruitmentCandidates || INITIAL_DATA.recruitmentCandidates,
        recruitmentFollowups: recruitmentFollowups && recruitmentFollowups.length > 0 ? recruitmentFollowups.map(f => ({
          id: f.id,
          candidateId: f.candidate_id,
          followupDate: f.followup_date,
          contactMedium: f.contact_medium,
          contactResult: f.contact_result,
          comments: f.comments,
          nextAction: f.next_action,
          nextActionDueDate: f.next_action_due_date,
          createdBy: f.created_by,
          createdAt: f.created_at
        })) : prev.recruitmentFollowups || INITIAL_DATA.recruitmentFollowups,
        recruitmentHistory: recruitmentHistory && recruitmentHistory.length > 0 ? recruitmentHistory.map(h => ({
          id: h.id,
          candidateId: h.candidate_id,
          actionType: h.action_type,
          previousStatus: h.previous_status,
          newStatus: h.new_status,
          actorName: h.actor_name,
          actorRole: h.actor_role,
          notes: h.notes,
          internalOnly: Boolean(h.internal_only),
          metadata: h.metadata || {},
          createdAt: h.created_at
        })) : prev.recruitmentHistory || INITIAL_DATA.recruitmentHistory,
        recruitmentNotifications: recruitmentNotifications && recruitmentNotifications.length > 0 ? recruitmentNotifications.map(n => ({
          id: n.id,
          targetRole: n.target_role,
          candidateId: n.candidate_id,
          candidateName: n.candidate_name,
          title: n.title,
          message: n.message,
          read: Boolean(n.read),
          createdAt: n.created_at
        })) : prev.recruitmentNotifications || INITIAL_DATA.recruitmentNotifications
      }));
      addToast('Datos sincronizados con Supabase', 'info');
    } catch (err) {
      console.warn('Could not sync from Supabase, using local state:', err);
    }
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
    } else {
      console.error('Error actualizando usuario en Supabase:', error);
      addToast(`Error al actualizar usuario: ${error.message}`, 'danger');
      return false;
    }
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

  /* ------------------- RECLUTAMIENTO DE PERSONAL ------------------- */
  const checkCandidateDuplicate = (phone, email, excludeId = null) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    const candidates = data.recruitmentCandidates || [];

    for (const cand of candidates) {
      if (excludeId && cand.id === excludeId) continue;
      const candCleanPhone = (cand.phone || '').replace(/\D/g, '');
      const candCleanEmail = (cand.email || '').trim().toLowerCase();

      if (cleanPhone && cleanPhone.length >= 7 && candCleanPhone && cleanPhone === candCleanPhone) {
        return { isDuplicate: true, matchedField: 'teléfono', existingCandidate: cand };
      }
      if (cleanEmail && candCleanEmail && cleanEmail === candCleanEmail) {
        return { isDuplicate: true, matchedField: 'correo electrónico', existingCandidate: cand };
      }
    }
    return { isDuplicate: false, matchedField: null, existingCandidate: null };
  };

  const addRecruitmentCandidate = async (candidateInput) => {
    const list = data.recruitmentCandidates || [];
    const folio = generateFolio('CAND', list);
    const newId = `cand-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newCandidate = {
      ...candidateInput,
      id: newId,
      folio: candidateInput.folio || folio,
      createdAt: nowIso,
      lastActivityAt: nowIso,
      status: candidateInput.status || 'Borrador'
    };

    const initialHistory = {
      id: `hist-${Date.now()}`,
      candidateId: newId,
      actionType: 'candidate_registered',
      previousStatus: null,
      newStatus: newCandidate.status,
      actorName: activeUser?.name || 'Reclutador Romo',
      actorRole: activeRole === 'Administrador' ? 'Empresa' : (activeRole || 'Reclutador'),
      notes: 'Registro inicial de datos de contacto y perfil de candidato',
      internalOnly: false,
      metadata: {},
      createdAt: nowIso
    };

    let notificationToAdd = null;
    if (newCandidate.status === 'Pendiente de revisión') {
      notificationToAdd = {
        id: `notif-${Date.now()}`,
        targetRole: 'Empresa',
        candidateId: newId,
        candidateName: newCandidate.fullName,
        title: 'Nuevo candidato enviado a revisión',
        message: `${newCandidate.fullName} fue postulado para la vacante ${newCandidate.vacancyTitle}.`,
        read: false,
        createdAt: nowIso
      };
    }

    if (supabase) {
      try {
        await supabase.from('romo_recruitment_candidates').insert([{
          id: newCandidate.id,
          folio: newCandidate.folio,
          vacancy_id: newCandidate.vacancyId,
          vacancy_title: newCandidate.vacancyTitle,
          full_name: newCandidate.fullName,
          phone: newCandidate.phone,
          whatsapp: newCandidate.whatsapp,
          email: newCandidate.email,
          city: newCandidate.city,
          municipality: newCandidate.municipality,
          neighborhood: newCandidate.neighborhood,
          source: newCandidate.source,
          source_details: newCandidate.sourceDetails,
          secondary_vacancies: newCandidate.secondaryVacancies,
          entry_availability: newCandidate.entryAvailability,
          schedule_availability: newCandidate.scheduleAvailability,
          salary_expectation: newCandidate.salaryExpectation,
          salary_period: newCandidate.salaryPeriod,
          transport_mode: newCandidate.transportMode,
          education: newCandidate.education,
          years_experience: newCandidate.yearsExperience,
          employment_history: newCandidate.employmentHistory,
          skills_certifications: newCandidate.skillsCertifications,
          recruiter_notes: newCandidate.recruiterNotes,
          specific_fields: newCandidate.specificFields,
          consent_share_profile: newCandidate.consentShareProfile,
          consent_date: newCandidate.consentDate,
          resume_url: newCandidate.resumeUrl,
          status: newCandidate.status,
          assigned_recruiter: newCandidate.assignedRecruiter || activeUser?.name,
          next_action: newCandidate.nextAction,
          next_action_date: newCandidate.nextActionDate,
          last_activity_at: nowIso,
          created_at: nowIso
        }]);

        await supabase.from('romo_recruitment_history').insert([{
          id: initialHistory.id,
          candidate_id: newId,
          action_type: initialHistory.actionType,
          previous_status: initialHistory.previousStatus,
          new_status: initialHistory.newStatus,
          actor_name: initialHistory.actorName,
          actor_role: initialHistory.actorRole,
          notes: initialHistory.notes,
          internal_only: initialHistory.internalOnly,
          created_at: nowIso
        }]);

        if (notificationToAdd) {
          await supabase.from('romo_recruitment_notifications').insert([{
            id: notificationToAdd.id,
            target_role: notificationToAdd.targetRole,
            candidate_id: notificationToAdd.candidateId,
            candidate_name: notificationToAdd.candidateName,
            title: notificationToAdd.title,
            message: notificationToAdd.message,
            read: false,
            created_at: nowIso
          }]);
        }
      } catch (err) {
        console.warn('Error saving candidate to Supabase, fallback local:', err);
      }
    }

    setData((prev) => ({
      ...prev,
      recruitmentCandidates: [newCandidate, ...(prev.recruitmentCandidates || [])],
      recruitmentHistory: [initialHistory, ...(prev.recruitmentHistory || [])],
      recruitmentNotifications: notificationToAdd 
        ? [notificationToAdd, ...(prev.recruitmentNotifications || [])]
        : (prev.recruitmentNotifications || [])
    }));

    addToast(`Candidato ${newCandidate.fullName} registrado (${newCandidate.folio})`);
    return newCandidate;
  };

  const updateRecruitmentCandidate = async (candidateId, updates) => {
    const nowIso = new Date().toISOString();
    const fullUpdates = { ...updates, lastActivityAt: nowIso };

    if (supabase) {
      try {
        const payload = {};
        if (updates.fullName !== undefined) payload.full_name = updates.fullName;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.city !== undefined) payload.city = updates.city;
        if (updates.municipality !== undefined) payload.municipality = updates.municipality;
        if (updates.neighborhood !== undefined) payload.neighborhood = updates.neighborhood;
        if (updates.vacancyId !== undefined) payload.vacancy_id = updates.vacancyId;
        if (updates.vacancyTitle !== undefined) payload.vacancy_title = updates.vacancyTitle;
        if (updates.source !== undefined) payload.source = updates.source;
        if (updates.sourceDetails !== undefined) payload.source_details = updates.sourceDetails;
        if (updates.secondaryVacancies !== undefined) payload.secondary_vacancies = updates.secondaryVacancies;
        if (updates.entryAvailability !== undefined) payload.entry_availability = updates.entryAvailability;
        if (updates.scheduleAvailability !== undefined) payload.schedule_availability = updates.scheduleAvailability;
        if (updates.salaryExpectation !== undefined) payload.salary_expectation = updates.salaryExpectation;
        if (updates.salaryPeriod !== undefined) payload.salary_period = updates.salaryPeriod;
        if (updates.transportMode !== undefined) payload.transport_mode = updates.transportMode;
        if (updates.education !== undefined) payload.education = updates.education;
        if (updates.yearsExperience !== undefined) payload.years_experience = updates.yearsExperience;
        if (updates.employmentHistory !== undefined) payload.employment_history = updates.employmentHistory;
        if (updates.skillsCertifications !== undefined) payload.skills_certifications = updates.skillsCertifications;
        if (updates.recruiterNotes !== undefined) payload.recruiter_notes = updates.recruiterNotes;
        if (updates.specificFields !== undefined) payload.specific_fields = updates.specificFields;
        if (updates.resumeUrl !== undefined) payload.resume_url = updates.resumeUrl;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.discardReason !== undefined) payload.discard_reason = updates.discardReason;
        if (updates.hireNotes !== undefined) payload.hire_notes = updates.hireNotes;
        if (updates.companyReviewer !== undefined) payload.company_reviewer = updates.companyReviewer;
        if (updates.assignedRecruiter !== undefined) payload.assigned_recruiter = updates.assignedRecruiter;
        if (updates.nextAction !== undefined) payload.next_action = updates.nextAction;
        if (updates.nextActionDate !== undefined) payload.next_action_date = updates.nextActionDate;
        payload.last_activity_at = nowIso;

        await supabase.from('romo_recruitment_candidates').update(payload).eq('id', candidateId);
      } catch (err) {
        console.warn('Error updating candidate in Supabase:', err);
      }
    }

    setData((prev) => ({
      ...prev,
      recruitmentCandidates: (prev.recruitmentCandidates || []).map((c) =>
        c.id === candidateId ? { ...c, ...fullUpdates } : c
      )
    }));
    addToast('Datos del candidato actualizados');
    return true;
  };

  const changeCandidateStatus = async ({
    candidateId,
    newStatus,
    notes = '',
    actorName,
    actorRole,
    isInternal = false,
    metadata = {},
    discardReason = '',
    hireNotes = '',
    nextAction = '',
    nextActionDate = null
  }) => {
    const cand = (data.recruitmentCandidates || []).find((c) => c.id === candidateId);
    if (!cand) return false;

    const previousStatus = cand.status;
    const nowIso = new Date().toISOString();
    const effectiveActorName = actorName || activeUser?.name || 'Usuario';
    const effectiveActorRole = actorRole || (activeRole === 'Administrador' ? 'Empresa' : (activeRole || 'Reclutador'));

    const historyEntry = {
      id: `hist-${Date.now()}`,
      candidateId,
      actionType: `status_change_to_${newStatus.toLowerCase().replace(/\s+/g, '_')}`,
      previousStatus,
      newStatus,
      actorName: effectiveActorName,
      actorRole: effectiveActorRole,
      notes,
      internalOnly: isInternal,
      metadata,
      createdAt: nowIso
    };

    let notificationToAdd = null;
    if (newStatus === 'Pendiente de revisión') {
      notificationToAdd = {
        id: `notif-${Date.now()}`,
        targetRole: 'Empresa',
        candidateId,
        candidateName: cand.fullName,
        title: 'Candidato enviado a revisión',
        message: `${effectiveActorName} envió el expediente de ${cand.fullName} (${cand.vacancyTitle}) para evaluación de la Empresa.`,
        read: false,
        createdAt: nowIso
      };
    } else if (
      newStatus === 'Información adicional solicitada' ||
      newStatus === 'Seguimiento solicitado' ||
      newStatus === 'Entrevista solicitada'
    ) {
      notificationToAdd = {
        id: `notif-${Date.now()}`,
        targetRole: 'Reclutador',
        candidateId,
        candidateName: cand.fullName,
        title: `La Empresa solicita: ${newStatus}`,
        message: `${effectiveActorName} indicó: "${notes || 'Revisar requerimiento en el expediente.'}" para ${cand.fullName}.`,
        read: false,
        createdAt: nowIso
      };
    }

    const candidateUpdates = {
      status: newStatus,
      lastActivityAt: nowIso,
      ...(discardReason ? { discardReason } : {}),
      ...(hireNotes ? { hireNotes } : {}),
      ...(nextAction ? { nextAction } : {}),
      ...(nextActionDate ? { nextActionDate } : {}),
      ...(effectiveActorRole === 'Empresa' ? { companyReviewer: effectiveActorName } : {})
    };

    if (supabase) {
      try {
        await supabase.from('romo_recruitment_candidates').update({
          status: newStatus,
          last_activity_at: nowIso,
          ...(discardReason ? { discard_reason: discardReason } : {}),
          ...(hireNotes ? { hire_notes: hireNotes } : {}),
          ...(nextAction ? { next_action: nextAction } : {}),
          ...(nextActionDate ? { next_action_date: nextActionDate } : {}),
          ...(effectiveActorRole === 'Empresa' ? { company_reviewer: effectiveActorName } : {})
        }).eq('id', candidateId);

        await supabase.from('romo_recruitment_history').insert([{
          id: historyEntry.id,
          candidate_id: candidateId,
          action_type: historyEntry.actionType,
          previous_status: previousStatus,
          new_status: newStatus,
          actor_name: effectiveActorName,
          actor_role: effectiveActorRole,
          notes,
          internal_only: isInternal,
          metadata,
          created_at: nowIso
        }]);

        if (notificationToAdd) {
          await supabase.from('romo_recruitment_notifications').insert([{
            id: notificationToAdd.id,
            target_role: notificationToAdd.targetRole,
            candidate_id: notificationToAdd.candidateId,
            candidate_name: notificationToAdd.candidateName,
            title: notificationToAdd.title,
            message: notificationToAdd.message,
            read: false,
            created_at: nowIso
          }]);
        }
      } catch (err) {
        console.warn('Error saving status change to Supabase:', err);
      }
    }

    setData((prev) => ({
      ...prev,
      recruitmentCandidates: (prev.recruitmentCandidates || []).map((c) =>
        c.id === candidateId ? { ...c, ...candidateUpdates } : c
      ),
      recruitmentHistory: [historyEntry, ...(prev.recruitmentHistory || [])],
      recruitmentNotifications: notificationToAdd
        ? [notificationToAdd, ...(prev.recruitmentNotifications || [])]
        : (prev.recruitmentNotifications || [])
    }));

    addToast(`Estado de ${cand.fullName} actualizado a "${newStatus}"`);
    return true;
  };

  const addCandidateFollowup = async (candidateId, followupData) => {
    const nowIso = new Date().toISOString();
    const newFollowup = {
      id: `foll-${Date.now()}`,
      candidateId,
      followupDate: followupData.followupDate || nowIso,
      contactMedium: followupData.contactMedium || 'llamada',
      contactResult: followupData.contactResult,
      comments: followupData.comments || '',
      nextAction: followupData.nextAction || '',
      nextActionDueDate: followupData.nextActionDueDate || null,
      createdBy: activeUser?.name || 'Reclutador Romo',
      createdAt: nowIso
    };

    const historyEntry = {
      id: `hist-${Date.now()}`,
      candidateId,
      actionType: 'contact_followup_recorded',
      previousStatus: null,
      newStatus: null,
      actorName: activeUser?.name || 'Reclutador Romo',
      actorRole: 'Reclutador',
      notes: `Contacto registrado (${newFollowup.contactMedium}): ${newFollowup.contactResult}. ${newFollowup.comments}`,
      internalOnly: false,
      metadata: { contactResult: newFollowup.contactResult, medium: newFollowup.contactMedium },
      createdAt: nowIso
    };

    const candUpdates = {
      lastActivityAt: nowIso,
      ...(newFollowup.nextAction ? { nextAction: newFollowup.nextAction } : {}),
      ...(newFollowup.nextActionDueDate ? { nextActionDate: newFollowup.nextActionDueDate } : {})
    };

    if (supabase) {
      try {
        await supabase.from('romo_recruitment_followups').insert([{
          id: newFollowup.id,
          candidate_id: candidateId,
          followup_date: newFollowup.followupDate,
          contact_medium: newFollowup.contactMedium,
          contact_result: newFollowup.contactResult,
          comments: newFollowup.comments,
          next_action: newFollowup.nextAction,
          next_action_due_date: newFollowup.nextActionDueDate,
          created_by: newFollowup.createdBy,
          created_at: nowIso
        }]);

        await supabase.from('romo_recruitment_candidates').update({
          last_activity_at: nowIso,
          ...(newFollowup.nextAction ? { next_action: newFollowup.nextAction } : {}),
          ...(newFollowup.nextActionDueDate ? { next_action_date: newFollowup.nextActionDueDate } : {})
        }).eq('id', candidateId);

        await supabase.from('romo_recruitment_history').insert([{
          id: historyEntry.id,
          candidate_id: candidateId,
          action_type: historyEntry.actionType,
          previous_status: null,
          new_status: null,
          actor_name: historyEntry.actorName,
          actor_role: historyEntry.actorRole,
          notes: historyEntry.notes,
          internal_only: false,
          created_at: nowIso
        }]);
      } catch (err) {
        console.warn('Error saving followup to Supabase:', err);
      }
    }

    setData((prev) => ({
      ...prev,
      recruitmentFollowups: [newFollowup, ...(prev.recruitmentFollowups || [])],
      recruitmentHistory: [historyEntry, ...(prev.recruitmentHistory || [])],
      recruitmentCandidates: (prev.recruitmentCandidates || []).map((c) =>
        c.id === candidateId ? { ...c, ...candUpdates } : c
      )
    }));

    addToast('Seguimiento registrado exitosamente');
    return newFollowup;
  };

  const addRecruitmentVacancy = async (vacancyInput) => {
    const newId = `vac-${Date.now()}`;
    const newVacancy = {
      ...vacancyInput,
      id: newId,
      status: vacancyInput.status || 'abierta',
      slots: Number(vacancyInput.slots) || 1
    };

    if (supabase) {
      try {
        await supabase.from('romo_recruitment_vacancies').insert([{
          id: newVacancy.id,
          title: newVacancy.title,
          department: newVacancy.department,
          location: newVacancy.location || 'Base Romo - Patio Matriz',
          description: newVacancy.description,
          requirements: newVacancy.requirements,
          schedule_shift: newVacancy.scheduleShift,
          slots: newVacancy.slots,
          status: newVacancy.status
        }]);
      } catch (err) {
        console.warn('Error saving vacancy to Supabase:', err);
      }
    }

    setData((prev) => ({
      ...prev,
      recruitmentVacancies: [newVacancy, ...(prev.recruitmentVacancies || [])]
    }));
    addToast(`Vacante "${newVacancy.title}" creada exitosamente`);
    return newVacancy;
  };

  const updateRecruitmentVacancy = async (vacancyId, updates) => {
    if (supabase) {
      try {
        const payload = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.department !== undefined) payload.department = updates.department;
        if (updates.location !== undefined) payload.location = updates.location;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.requirements !== undefined) payload.requirements = updates.requirements;
        if (updates.scheduleShift !== undefined) payload.schedule_shift = updates.scheduleShift;
        if (updates.slots !== undefined) payload.slots = Number(updates.slots);
        if (updates.status !== undefined) payload.status = updates.status;

        await supabase.from('romo_recruitment_vacancies').update(payload).eq('id', vacancyId);
      } catch (err) {
        console.warn('Error updating vacancy in Supabase:', err);
      }
    }

    setData((prev) => ({
      ...prev,
      recruitmentVacancies: (prev.recruitmentVacancies || []).map((v) =>
        v.id === vacancyId ? { ...v, ...updates } : v
      )
    }));
    addToast('Vacante actualizada');
    return true;
  };

  const markNotificationAsRead = async (notifId) => {
    if (supabase) {
      try {
        await supabase.from('romo_recruitment_notifications').update({ read: true }).eq('id', notifId);
      } catch (e) {
        console.warn('Error updating notif:', e);
      }
    }
    setData((prev) => ({
      ...prev,
      recruitmentNotifications: (prev.recruitmentNotifications || []).map((n) =>
        n.id === notifId ? { ...n, read: true } : n
      )
    }));
  };

  const markAllNotificationsAsRead = async (targetRole) => {
    if (supabase) {
      try {
        await supabase.from('romo_recruitment_notifications')
          .update({ read: true })
          .or(`target_role.eq.${targetRole},target_role.eq.Todos`);
      } catch (e) {
        console.warn('Error updating all notifs:', e);
      }
    }
    setData((prev) => ({
      ...prev,
      recruitmentNotifications: (prev.recruitmentNotifications || []).map((n) =>
        (n.targetRole === targetRole || n.targetRole === 'Todos') ? { ...n, read: true } : n
      )
    }));
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
        addAdjustment,
        // RECLUTAMIENTO EXPORTS
        checkCandidateDuplicate,
        addRecruitmentCandidate,
        updateRecruitmentCandidate,
        changeCandidateStatus,
        addCandidateFollowup,
        addRecruitmentVacancy,
        updateRecruitmentVacancy,
        markNotificationAsRead,
        markAllNotificationsAsRead
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

