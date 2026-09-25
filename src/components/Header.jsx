import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, UserCheck, RefreshCw, Moon, Sun, Grid } from 'lucide-react';
import { CheckInWidget } from './CheckInWidget';

export const Header = ({ currentView, setCurrentView, searchTerm, setSearchTerm, activeModule, setActiveModule }) => {
  const { activeRole, activeUser, data, resetDemoData, theme, toggleTheme, logout } = useApp();

  // Calculate total active alerts count
  const lowStockCount = data.products.filter(p => p.status === 'activo' && p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = data.products.filter(p => p.status === 'activo' && p.currentStock === 0).length;
  const openWOCount = data.workOrders.filter(w => w.status === 'abierta' || w.status === 'en proceso').length;
  const totalAlerts = lowStockCount + outOfStockCount + openWOCount;

  const rolesList = [
    'Administrador',
    'Encargado de almacén',
    'Compras',
    'Mecánico',
    'Gerencia',
    'Operador'
  ];

  return (
    <header className="header-bar">
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => setActiveModule && setActiveModule(null)}
          title="Regresar al Portal Empresarial (Módulos)"
          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}
        >
          <Grid size={20} />
        </button>
        <img src="/logo.jpg" alt="Transportes HRG" className="header-logo" />
        <div>
          <div className="header-title">Transportes Romo</div>
          <div className="header-subtitle">
            {activeModule === 'recursos_humanos' ? 'RECURSOS HUMANOS' :
             activeModule === 'capacitaciones' ? 'CAPACITACIONES' :
             activeModule === 'mantenimientos' ? 'MANTENIMIENTO' :
             activeModule === 'administracion' ? 'ADMINISTRACIÓN GLOBAL' :
             activeModule === 'monitoreo' ? 'MONITOREO SATELITAL' :
             'CONTROL DE INVENTARIO'}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        <CheckInWidget />

        {/* Global Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar código, refacción, unidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '36px',
              borderRadius: '9999px',
              width: '210px',
              fontSize: '0.8rem'
            }}
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Alerts Button */}
        <button
          onClick={() => setCurrentView('alertas')}
          style={{
            background: 'none',
            border: 'none',
            color: totalAlerts > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            padding: '8px'
          }}
          title="Ver Alertas del Sistema"
        >
          <Bell size={20} />
          {totalAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'var(--color-danger)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {totalAlerts}
            </span>
          )}
        </button>

        {/* User Profile and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="user-profile-badge">
            <UserCheck size={16} style={{ color: 'var(--color-primary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{activeUser?.name}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{activeRole}</span>
            </div>
          </div>
          
          <button 
            className="btn btn-dark btn-sm" 
            onClick={logout}
            title="Cerrar Sesión"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
};
