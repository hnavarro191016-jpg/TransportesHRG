export const INITIAL_DATA = {
  categories: [
    { id: 'cat-1', name: 'Motor', description: 'Refacciones para motor diesel Cummins/Detroit' },
    { id: 'cat-2', name: 'Frenos', description: 'Tambores, balatas, matracas, válvulas y sensores ABS' },
    { id: 'cat-3', name: 'Suspensión', description: 'Bolsas de aire, bujes, amortiguadores y pernos' },
    { id: 'cat-4', name: 'Sistema eléctrico', description: 'Faros LED, mazo de cables, marchas y alternadores' },
    { id: 'cat-5', name: 'Llantas', description: 'Neumáticos 11R22.5 y 295/75R22.5 para tráiler' },
    { id: 'cat-6', name: 'Lubricantes', description: 'Aceites 15W-40, grasa de chasis y líquido refrigerante' },
    { id: 'cat-7', name: 'Filtros', description: 'Filtros de aceite, diesel, agua y aire comprimido' },
    { id: 'cat-8', name: 'Carrocería', description: 'Espejos, lodera, defensas y faldones' },
    { id: 'cat-9', name: 'Herramientas', description: 'Llaves de artillería, dados pesados y gatos hidráulicos' },
    { id: 'cat-10', name: 'Consumibles', description: 'Cinta aislante, abrazaderas, WD-40 y trazadores' },
    { id: 'cat-11', name: 'Otros', description: 'Materiales varios y accesorios de taller' }
  ],
  brands: [
    { id: 'b-1', name: 'Bendix' },
    { id: 'b-2', name: 'Goodyear' },
    { id: 'b-3', name: 'Fleetguard' },
    { id: 'b-4', name: 'Mobil' },
    { id: 'b-5', name: 'Meritor' },
    { id: 'b-6', name: 'Cummins' },
    { id: 'b-7', name: 'Stemco' },
    { id: 'b-8', name: 'Grote' },
    { id: 'b-9', name: 'Hendrickson' },
    { id: 'b-10', name: 'Freightliner' }
  ],
  warehouses: [
    { id: 'wh-1', name: 'Almacén Taller Central', location: 'Taller Matriz - Monterrey', description: 'Almacén principal de refacciones pesadas' },
    { id: 'wh-2', name: 'Bodega de Lubricantes y Grasas', location: 'Zona Exterior Taller', description: 'Almacenamiento de tambos de aceite y fluidos' },
    { id: 'wh-3', name: 'Caseta de Refacciones Rápidas', location: 'Área de Foso de Servicio', description: 'Refacciones de alta rotación para mecánicos' }
  ],
  suppliers: [
    {
      id: 'sup-1',
      name: 'Distribuidora de Partes Pesadas S.A. de C.V.',
      rfc: 'DPP981120TR4',
      contact: 'Ing. Carlos Mendoza',
      phone: '81-8390-1200',
      email: 'ventas@partaspesadas.com.mx',
      address: 'Av. Industrial 450, Monterrey, N.L.',
      paymentTerms: '30 días crédito',
      status: 'activo',
      notes: 'Proveedor principal de frenos y suspensión Meritor/Bendix'
    },
    {
      id: 'sup-2',
      name: 'Refacciones y Frenos Romo S. de R.L.',
      rfc: 'RFR050412KL9',
      contact: 'Lic. Laura Garza',
      phone: '81-8154-8800',
      email: 'pedidos@refaccionesromo.mx',
      address: 'Carretera a Laredo Km 18, Escobedo, N.L.',
      paymentTerms: '15 días crédito',
      status: 'activo',
      notes: 'Distribuidor autorizado Fleetguard y Mobil'
    },
    {
      id: 'sup-3',
      name: 'Llantas y Sensores de México',
      rfc: 'LSM120901AA2',
      contact: 'Roberto Sánchez',
      phone: '81-8901-4455',
      email: 'contacto@llantaspesadas.mx',
      address: 'Av. Gonzalitos 890, Monterrey, N.L.',
      paymentTerms: 'Contado',
      status: 'activo',
      notes: 'Proveedor de neumáticos Bridgestone y Goodyear'
    }
  ],
  units: [
    {
      id: 'u-101',
      economicNumber: 'Eco-101',
      plates: '84-AA-1K',
      unitType: 'Tractor Quinta Rueda',
      brand: 'Freightliner',
      model: 'Cascadia 126',
      year: 2022,
      vin: '3AKJHHDR8NSLK1902',
      status: 'activo',
      notes: 'Unidad asignada a ruta Monterrey - Nuevo Laredo'
    },
    {
      id: 'u-102',
      economicNumber: 'Eco-102',
      plates: '92-BB-2M',
      unitType: 'Tractor Quinta Rueda',
      brand: 'Kenworth',
      model: 'T680 Next Gen',
      year: 2023,
      vin: '1XKDDP9X8PR776102',
      status: 'en mantenimiento',
      notes: 'En taller por cambio de balatas y revisión de ABS'
    },
    {
      id: 'u-103',
      economicNumber: 'Eco-103',
      plates: '15-CC-4P',
      unitType: 'Tractor Quinta Rueda',
      brand: 'International',
      model: 'LT 625',
      year: 2021,
      vin: '3HSDJSAR0MN552109',
      status: 'activo',
      notes: 'Motor Cummins X15'
    },
    {
      id: 'u-201',
      economicNumber: 'R-201',
      plates: '77-TY-9R',
      unitType: 'Remolque Caja Seca 53ft',
      brand: 'Utility',
      model: 'VS2RA',
      year: 2020,
      vin: '1UYVS2530L1099238',
      status: 'activo',
      notes: 'Suspensión de aire Hendrickson Vantraax'
    }
    ,{
      id: 'u-t01',
      economicNumber: 'T-01',
      plates: 'SIN PLACAS',
      unitType: 'Remolque / Tráiler',
      brand: 'Utility',
      model: 'Caja seca 53 ft',
      year: 2024,
      vin: 'DEMO-TRAILER-T01',
      status: 'activo',
      notes: 'Unidad de demostración para reportes de mantenimiento'
    }
  ],
  products: [
    {
      id: 'prod-1',
      codeInternal: 'REF-1001',
      codeSupplier: 'BND-4707Q-STD',
      name: 'Juego de Balatas de Tambor 4707Q (Kit 2 Ruedas)',
      description: 'Juego de balatas vulcanizadas grado pesado para eje trasero de tráiler o tracto',
      category: 'Frenos',
      brand: 'Bendix',
      unitOfMeasure: 'juego',
      compatibility: 'Cascadia, Kenworth T680, Remolques 53ft',
      unitCost: 1450.00,
      refPrice: 1800.00,
      currentStock: 14,
      minStock: 5,
      maxStock: 30,
      warehouse: 'Almacén Taller Central',
      locationDetails: 'Estante A1 - Frenos',
      photoUrl: '',
      status: 'activo',
      expirationDate: ''
    },
    {
      id: 'prod-2',
      codeInternal: 'REF-1002',
      codeSupplier: 'GDY-1R12-095',
      name: 'Bolsa de Aire Suspensión Goodyear 1R12-095',
      description: 'Bolsa neumática de suspensión para eje motriz de tractocamión',
      category: 'Suspensión',
      brand: 'Goodyear',
      unitOfMeasure: 'pieza',
      compatibility: 'Freightliner, International LT, Kenworth',
      unitCost: 2200.00,
      refPrice: 2750.00,
      currentStock: 3,
      minStock: 4,
      maxStock: 15,
      warehouse: 'Almacén Taller Central',
      locationDetails: 'Estante B2 - Suspensión',
      photoUrl: '',
      status: 'activo',
      expirationDate: ''
    },
    {
      id: 'prod-3',
      codeInternal: 'REF-1003',
      codeSupplier: 'FLG-LF14000NN',
      name: 'Filtro de Aceite Fleetguard LF14000NN NanoNet',
      description: 'Filtro de aceite sintético para motor Cummins ISX / X15',
      category: 'Filtros',
      brand: 'Fleetguard',
      unitOfMeasure: 'pieza',
      compatibility: 'Motor Cummins ISX15 / X15',
      unitCost: 680.00,
      refPrice: 850.00,
      currentStock: 25,
      minStock: 10,
      maxStock: 50,
      warehouse: 'Caseta de Refacciones Rápidas',
      locationDetails: 'Rack 1 - Filtros',
      photoUrl: '',
      status: 'activo',
      expirationDate: ''
    },
    {
      id: 'prod-4',
      codeInternal: 'REF-1004',
      codeSupplier: 'MBL-15W40-19L',
      name: 'Aceite Mobil Delvac Modern 15W-40 (Cubeta 19 Litros)',
      description: 'Aceite multigrado premium para motores diesel de trabajo pesado CK-4',
      category: 'Lubricantes',
      brand: 'Mobil',
      unitOfMeasure: 'caja',
      compatibility: 'Universal Motores Diesel Cummins, Detroit, Paccar',
      unitCost: 1890.00,
      refPrice: 2300.00,
      currentStock: 8,
      minStock: 6,
      maxStock: 25,
      warehouse: 'Bodega de Lubricantes y Grasas',
      locationDetails: 'Plataforma A - Fluidos',
      photoUrl: '',
      status: 'activo',
      expirationDate: '2027-12-31'
    },
    {
      id: 'prod-5',
      codeInternal: 'REF-1005',
      codeSupplier: 'BND-K027380',
      name: 'Sensor de Velocidad ABS Bendix Recto 90 Grados',
      description: 'Sensor antibloqueo para maza de rueda de tráiler con cable de 1.8m',
      category: 'Sistema eléctrico',
      brand: 'Bendix',
      unitOfMeasure: 'pieza',
      compatibility: 'Sistemas Bendix TABS-6 / EC-60',
      unitCost: 850.00,
      refPrice: 1100.00,
      currentStock: 0,
      minStock: 3,
      maxStock: 12,
      warehouse: 'Almacén Taller Central',
      locationDetails: 'Cajón C3 - Electrónica',
      photoUrl: '',
      status: 'activo',
      expirationDate: ''
    },
    {
      id: 'prod-6',
      codeInternal: 'REF-1006',
      codeSupplier: 'GRT-46302',
      name: 'Faro Principal LED 7" Sellado Alta/Baja',
      description: 'Faro LED reforzado para tractocamión resiste vibraciones',
      category: 'Sistema eléctrico',
      brand: 'Grote',
      unitOfMeasure: 'pieza',
      compatibility: 'Kenworth W900, Freightliner FLD, International',
      unitCost: 1950.00,
      refPrice: 2400.00,
      currentStock: 6,
      minStock: 2,
      maxStock: 10,
      warehouse: 'Almacén Taller Central',
      locationDetails: 'Estante A3 - Iluminación',
      photoUrl: '',
      status: 'activo',
      expirationDate: ''
    }
  ],
  purchases: [
    {
      id: 'pur-1',
      folio: 'ENT-001',
      date: '2026-08-01',
      supplierId: 'sup-1',
      supplierName: 'Distribuidora de Partes Pesadas S.A. de C.V.',
      invoiceNumber: 'FAC-99210',
      warehouse: 'Almacén Taller Central',
      responsibleUser: 'Juan Pérez (Almacén)',
      notes: 'Reabastecimiento mensual de balatas y suspensión',
      items: [
        { productId: 'prod-1', productCode: 'REF-1001', productName: 'Juego de Balatas de Tambor 4707Q', qty: 10, unitCost: 1450.00, taxPercent: 16, subtotal: 14500.00, total: 16820.00 },
        { productId: 'prod-2', productCode: 'REF-1002', productName: 'Bolsa de Aire Suspensión Goodyear 1R12-095', qty: 5, unitCost: 2200.00, taxPercent: 16, subtotal: 11000.00, total: 12760.00 }
      ],
      subtotal: 25500.00,
      totalTax: 4080.00,
      total: 29580.00
    }
  ],
  exits: [
    {
      id: 'ext-1',
      folio: 'SAL-001',
      date: '2026-08-05',
      reason: 'Mantenimiento preventivo',
      unitId: 'u-102',
      economicNumber: 'Eco-102',
      workOrderId: 'work-1',
      workOrderFolio: 'OT-001',
      warehouse: 'Almacén Taller Central',
      responsibleUser: 'Carlos Mecánico',
      notes: 'Salida de refacciones para servicio de frenos Eco-102',
      items: [
        { productId: 'prod-1', productCode: 'REF-1001', productName: 'Juego de Balatas de Tambor 4707Q', qty: 2, unitCost: 1450.00, subtotal: 2900.00 }
      ],
      totalCost: 2900.00
    }
  ],
  workOrders: [
    {
      id: 'work-1',
      folio: 'OT-001',
      unitId: 'u-102',
      economicNumber: 'Eco-102',
      unitInfo: 'Kenworth T680 2023',
      type: 'preventivo',
      issueDescription: 'Ruido al frenar en eje trasero y vibración en baja velocidad',
      diagnosis: 'Desgaste en balatas traseras derechas. Se requiere reemplazo de balatas.',
      technician: 'Carlos M. / Taller',
      status: 'en proceso',
      openDate: '2026-08-05 09:00',
      closeDate: '',
      partsUsed: [
        { productId: 'prod-1', productCode: 'REF-1001', name: 'Juego de Balatas de Tambor 4707Q', qty: 2, unitCost: 1450.00, totalCost: 2900.00 }
      ],
      laborCost: 1200.00,
      totalCost: 4100.00
    }
  ],
  transfers: [
    {
      id: 'tr-1',
      folio: 'TR-001',
      date: '2026-08-03',
      originWarehouse: 'Almacén Taller Central',
      destinationWarehouse: 'Caseta de Refacciones Rápidas',
      responsibleUser: 'Juan Pérez',
      notes: 'Mover filtros de aceite a caseta de foso rápido',
      items: [
        { productId: 'prod-3', productCode: 'REF-1003', productName: 'Filtro de Aceite Fleetguard LF14000NN NanoNet', qty: 10 }
      ]
    }
  ],
  physicalAdjustments: [
    {
      id: 'adj-1',
      folio: 'AJ-001',
      date: '2026-08-02',
      warehouse: 'Almacén Taller Central',
      responsibleUser: 'Juan Pérez',
      reason: 'Ajuste por conteo semestral',
      items: [
        { productId: 'prod-4', productCode: 'REF-1004', productName: 'Aceite Mobil Delvac Modern 15W-40', previousQty: 9, adjustedQty: 8, diff: -1, unitCost: 1890.00 }
      ],
      notes: 'Se encontró una cubeta fisurada en inventario'
    }
  ],
  kardex: [
    {
      id: 'k-1',
      dateTime: '2026-08-01 10:30',
      folio: 'ENT-001',
      productId: 'prod-1',
      productCode: 'REF-1001',
      productName: 'Juego de Balatas de Tambor 4707Q',
      type: 'entrada',
      qtyIn: 10,
      qtyOut: 0,
      resultingStock: 16,
      unitCost: 1450.00,
      warehouse: 'Almacén Taller Central',
      unitRelated: '-',
      user: 'Juan Pérez (Almacén)',
      notes: 'Entrada por compra Factura FAC-99210'
    },
    {
      id: 'k-2',
      dateTime: '2026-08-02 16:00',
      folio: 'AJ-001',
      productId: 'prod-4',
      productCode: 'REF-1004',
      productName: 'Aceite Mobil Delvac Modern 15W-40',
      type: 'ajuste',
      qtyIn: 0,
      qtyOut: 1,
      resultingStock: 8,
      unitCost: 1890.00,
      warehouse: 'Almacén Taller Central',
      unitRelated: '-',
      user: 'Juan Pérez',
      notes: 'Ajuste por conteo físico (-1 por cubeta dañada)'
    },
    {
      id: 'k-3',
      dateTime: '2026-08-05 11:15',
      folio: 'SAL-001',
      productId: 'prod-1',
      productCode: 'REF-1001',
      productName: 'Juego de Balatas de Tambor 4707Q',
      type: 'salida',
      qtyIn: 0,
      qtyOut: 2,
      resultingStock: 14,
      unitCost: 1450.00,
      warehouse: 'Almacén Taller Central',
      unitRelated: 'Eco-102',
      user: 'Carlos Mecánico',
      notes: 'Salida vinculada a OT-001 de unidad Eco-102'
    }
  ],
  users: [
    { id: 'usr-1', name: 'Roberto Romo', email: 'gerencia@transportesromo.mx', role: 'Gerencia', active: true },
    { id: 'usr-2', name: 'Juan Pérez', email: 'almacen@transportesromo.mx', role: 'Encargado de almacén', active: true },
    { id: 'usr-3', name: 'Laura Garza', email: 'compras@transportesromo.mx', role: 'Compras', active: true },
    { id: 'usr-4', name: 'Carlos Mendoza', email: 'mecanico@transportesromo.mx', role: 'Mecánico', active: true },
    { id: 'usr-5', name: 'Administrador Romo', email: 'admin@transportesromo.mx', role: 'Administrador', active: true }
  ],
  employees: [],
  courses: [],
  courseAssignments: []
};
