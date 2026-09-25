import React from 'react';
import { ClipboardList, Wrench, BarChart3, MessageCirclePlus } from 'lucide-react';

export const SidebarMantenimiento = ({ currentView, setCurrentView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard del taller', icon: BarChart3 },
    { id: 'report_incident', label: 'Reportar incidencia', icon: MessageCirclePlus },
    { id: 'work_orders', label: 'Tickets de mantenimiento', icon: ClipboardList },
    { id: 'despacho', label: 'Despacho a unidad', icon: Wrench }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ color: '#d4af37', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>MANTENIMIENTOS</div>
        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>Control de tickets y taller</div>
      </div>
      <nav className="sidebar-menu">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setCurrentView(id)} className={`sidebar-item ${currentView === id ? 'active' : ''}`}>
            <Icon size={18} /> <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
