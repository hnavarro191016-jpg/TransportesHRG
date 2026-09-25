import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  Users,
  Truck,
  ShoppingCart,
  ArrowUpRight,
  Wrench,
  ArrowLeftRight,
  ClipboardCheck,
  History,
  AlertTriangle,
  FileBarChart,
  UserCog
} from 'lucide-react';

export const Sidebar = ({ currentView, setCurrentView }) => {
  const { data, activeRole } = useApp();

  // Calculate counters for badges
  const lowStockCount = data.products.filter(p => p.status === 'activo' && p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = data.products.filter(p => p.status === 'activo' && p.currentStock === 0).length;
  const totalAlertsCount = lowStockCount + outOfStockCount;
  const openWOCount = data.workOrders.filter(w => w.status === 'abierta' || w.status === 'en proceso').length;

  const menuItems = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard, roleAccess: ['Administrador', 'Encargado de almacén', 'Compras', 'Mecánico', 'Gerencia'] },
    { id: 'productos', label: '2. Productos / Refacciones', icon: Package, roleAccess: ['Administrador', 'Encargado de almacén', 'Mecánico'] },
    { id: 'categorias', label: '3. Categorías y Marcas', icon: Tags, roleAccess: ['Administrador', 'Encargado de almacén'] },
    { id: 'almacenes', label: '4. Almacenes y Ubicaciones', icon: Warehouse, roleAccess: ['Administrador', 'Encargado de almacén'] },
    { id: 'proveedores', label: '5. Proveedores', icon: Users, roleAccess: ['Administrador', 'Compras'] },
    { id: 'unidades', label: '6. Unidades / Tráilers', icon: Truck, roleAccess: ['Administrador', 'Encargado de almacén', 'Mecánico'] },
    { id: 'compras', label: '7. Compras y Entradas', icon: ShoppingCart, roleAccess: ['Administrador', 'Encargado de almacén', 'Compras'] },
    { id: 'salidas', label: '8. Salidas de Inventario', icon: ArrowUpRight, roleAccess: ['Administrador', 'Encargado de almacén'] },
    { id: 'ordenes', label: '9. Órdenes de Trabajo (OT)', icon: Wrench, badge: openWOCount > 0 ? openWOCount : null, roleAccess: ['Administrador', 'Mecánico'] },
    { id: 'inventarioFisico', label: '10. Inventario Físico', icon: ClipboardCheck, roleAccess: ['Administrador', 'Encargado de almacén'] },
    { id: 'kardex', label: '11. Kardex / Movimientos', icon: History, roleAccess: ['Administrador', 'Encargado de almacén', 'Gerencia'] },
    { id: 'alertas', label: '12. Alertas', icon: AlertTriangle, badge: totalAlertsCount > 0 ? totalAlertsCount : null, roleAccess: ['Administrador', 'Encargado de almacén', 'Gerencia'] },
    { id: 'reportes', label: '13. Reportes', icon: FileBarChart, roleAccess: ['Administrador', 'Encargado de almacén', 'Compras', 'Gerencia'] }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ color: '#d4af37', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          MENÚ PRINCIPAL
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
          Sistema Control Romo v1.0
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isAllowed = item.roleAccess.includes(activeRole);

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={{
                opacity: isAllowed ? 1 : 0.45,
                background: isActive ? undefined : undefined
              }}
              title={!isAllowed ? `Acceso restringido para rol: ${activeRole}` : undefined}
            >
              <Icon size={18} className="sidebar-icon" />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge && <span className="sidebar-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
