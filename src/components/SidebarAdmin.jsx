import React from 'react';
import { UserCog } from 'lucide-react';

export const SidebarAdmin = ({ currentView, setCurrentView }) => {
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
        <button
          onClick={() => setCurrentView('usuarios')}
          className={`sidebar-item ${currentView === 'usuarios' ? 'active' : ''}`}
        >
          <UserCog size={18} />
          <span>Usuarios y Permisos</span>
        </button>
      </nav>
    </aside>
  );
};
