import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Users, CheckSquare, Briefcase, UserPlus, Bell, ArrowLeft } from 'lucide-react';

export const SidebarReclutamiento = ({ currentView, setCurrentView, setIsSidebarOpen, openNewCandidateModal }) => {
  const { data, activeRole } = useApp();

  const getMenuItemClass = (viewName) => {
    return `sidebar-item ${currentView === viewName ? 'active' : ''}`;
  };

  // Contadores para badges
  const candidates = data.recruitmentCandidates || [];
  const notifications = data.recruitmentNotifications || [];
  
  const pendingReviewCount = candidates.filter(c => c.status === 'Pendiente de revisión').length;
  const recruiterPendingCount = candidates.filter(c => 
    c.status === 'Información adicional solicitada' ||
    c.status === 'Seguimiento solicitado' ||
    c.status === 'Entrevista solicitada'
  ).length;

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          RECLUTAMIENTO ROMO
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
          Atracción de Talento v1.0
        </div>
      </div>

      <div style={{ padding: '0 16px 12px 16px' }}>
        <button
          onClick={() => {
            if (openNewCandidateModal) openNewCandidateModal();
            if (setIsSidebarOpen) setIsSidebarOpen(false);
          }}
          className="btn btn-primary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: '#0284c7',
            borderColor: '#0284c7',
            padding: '10px 14px',
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
          }}
        >
          <UserPlus size={18} />
          <span>Nuevo Candidato</span>
        </button>
      </div>

      <nav className="sidebar-menu">
        <button className={getMenuItemClass('dashboard')} onClick={() => { setCurrentView('dashboard'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <LayoutDashboard size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Panel General</span>
          {pendingReviewCount > 0 && (
            <span style={{
              background: '#eab308',
              color: '#000',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px'
            }}>
              {pendingReviewCount}
            </span>
          )}
        </button>

        <button className={getMenuItemClass('candidatos')} onClick={() => { setCurrentView('candidatos'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <Users size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Candidatos</span>
          <span style={{
            background: 'var(--color-bg-subtle, #334155)',
            color: 'var(--color-text-muted, #94a3b8)',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '999px'
          }}>
            {candidates.length}
          </span>
        </button>

        <button className={getMenuItemClass('pendientes')} onClick={() => { setCurrentView('pendientes'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <CheckSquare size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Mis Pendientes</span>
          {recruiterPendingCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px'
            }}>
              {recruiterPendingCount}
            </span>
          )}
        </button>

        <button className={getMenuItemClass('vacantes')} onClick={() => { setCurrentView('vacantes'); if (setIsSidebarOpen) setIsSidebarOpen(false); }}>
          <Briefcase size={18} className="sidebar-icon" />
          <span style={{ flex: 1, textAlign: 'left' }}>Catálogo Vacantes</span>
        </button>

        <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '16px 20px' }}></div>

        <div style={{ padding: '0 20px 8px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          Información de Rol
        </div>

        <div style={{ padding: '0 20px', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
          <div>Perfil activo: <strong style={{ color: 'var(--color-text-main)' }}>{activeRole}</strong></div>
          <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>
            {activeRole === 'Reclutador' 
              ? 'Captura perfiles y ejecuta seguimientos solicitados.' 
              : 'Evalúa perfiles, solicita seguimiento y autoriza contratación.'}
          </div>
        </div>
      </nav>
    </aside>
  );
};
