import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, UserCheck, Moon, Sun, Grid, Menu, LogOut } from 'lucide-react';
import { CheckInWidget } from './CheckInWidget';

export const Header = ({ currentView, setCurrentView, searchTerm, setSearchTerm, activeModule, setActiveModule, isSidebarOpen, setIsSidebarOpen }) => {
  const { activeRole, activeUser, data, resetDemoData, theme, toggleTheme, logout } = useApp();

  // Hide on scroll state
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsHeaderHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderHidden(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Calculate total active alerts count
  const lowStockCount = data.products.filter(p => p.status === 'activo' && p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = data.products.filter(p => p.status === 'activo' && p.currentStock === 0).length;
  const openWOCount = data.workOrders.filter(w => w.status === 'abierta' || w.status === 'en proceso').length;
  const totalAlerts = lowStockCount + outOfStockCount + openWOCount;

  return (
    <header className={`header-bar ${isHeaderHidden ? 'header-hidden' : ''}`}>
      <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeRole !== 'Operador' && activeModule !== 'monitoreo' && (
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            title="Abrir Menu"
            style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}
          >
            <Menu size={20} />
          </button>
        )}
        <button 
          onClick={() => setActiveModule && setActiveModule(null)}
          title="Regresar al Portal Empresarial"
          style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}
        >
          <Grid size={20} />
        </button>
        <img src="/logo.jpg" alt="Transportes HRG" className="header-logo desktop-only" />
        <div className="header-title-container">
          <div className="header-title desktop-only">Transportes Romo</div>
          <div className="header-subtitle">
            {activeModule === 'recursos_humanos' ? 'RECURSOS HUMANOS' :
             activeModule === 'capacitaciones' ? 'CAPACITACIONES' :
             activeModule === 'mantenimientos' ? 'MANTENIMIENTO' :
             activeModule === 'administracion' ? 'ADMINISTRACION' :
             activeModule === 'monitoreo' ? 'MONITOREO' :
             'INVENTARIO'}
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="header-right-controls">
        
        <div className="desktop-only">
          <CheckInWidget />
        </div>

        {/* Global Search Input */}
        <div className="desktop-only" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '36px',
              borderRadius: '9999px',
              width: '180px',
              fontSize: '0.8rem'
            }}
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle-btn desktop-only"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-profile-badge desktop-only">
            <UserCheck size={16} style={{ color: 'var(--color-primary)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{activeUser?.name}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{activeRole}</span>
            </div>
          </div>
          
          <button 
            className="btn btn-dark btn-sm mobile-icon-btn" 
            onClick={logout}
            title="Cerrar Sesion"
          >
            <span className="desktop-only">Salir</span>
            <LogOut size={16} className="mobile-only" />
          </button>
        </div>
      </div>
    </header>
  );
};
