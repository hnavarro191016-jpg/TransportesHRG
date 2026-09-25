import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Library, Award, Settings, ChevronRight, BarChart2 } from 'lucide-react';

export const SidebarCapacitaciones = ({ currentView, setCurrentView }) => {
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


        <button className={getMenuItemClass('mis_capacitaciones')} onClick={() => setCurrentView('mis_capacitaciones')}>
          <Award size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Mis Capacitaciones</span>
        </button>

        <button className={getMenuItemClass('catalogo')} onClick={() => setCurrentView('catalogo')}>
          <Library size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Catálogo de Cursos</span>
        </button>

        {(activeRole === 'Administrador' || activeRole === 'Gerencia') && (
          <>
            <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '16px 20px' }}></div>
            
            <button className={getMenuItemClass('admin_cursos')} onClick={() => setCurrentView('admin_cursos')}>
              <Settings size={18} className="sidebar-icon" />
              <span style={{ flex: 1, textAlign: 'left' }}>Administración</span>
            </button>
            <button className={getMenuItemClass('dashboard')} onClick={() => setCurrentView('dashboard')}>
              <BarChart2 size={18} className="sidebar-icon" />
              <span style={{ flex: 1, textAlign: 'left' }}>Dashboard General</span>
            </button>
          </>
        )}
      </nav>
    </aside>
  );
};
