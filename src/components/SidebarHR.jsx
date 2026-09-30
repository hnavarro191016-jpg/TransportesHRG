import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, FileText, CalendarCheck, Settings, AlertTriangle } from 'lucide-react';

export const SidebarHR = ({ currentView, setCurrentView, setIsSidebarOpen }) => {
  const { activeRole } = useApp();

  const getMenuItemClass = (viewName) => {
    return `sidebar-item ${currentView === viewName ? 'active' : ''}`;
  };

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
        <button className={getMenuItemClass('dashboard')} onClick={() => { setCurrentView('dashboard'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <LayoutDashboard size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Dashboard RRHH</span>
        </button>

        <button className={getMenuItemClass('empleados')} onClick={() => { setCurrentView('empleados'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <Users size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Directorio de Empleados</span>
        </button>

        <button className={getMenuItemClass('documentos')} onClick={() => { setCurrentView('documentos'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <FileText size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Expedientes y Docs</span>
        </button>

        <button className={getMenuItemClass('asistencias')} onClick={() => { setCurrentView('asistencias'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <CalendarCheck size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Asistencias y Faltas</span>
        </button>

        <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '16px 20px' }}></div>

        <button className={getMenuItemClass('alertas')} onClick={() => { setCurrentView('alertas'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <AlertTriangle size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Alertas de Vencimiento</span>
        </button>
      </nav>
    </aside>
  );
};
