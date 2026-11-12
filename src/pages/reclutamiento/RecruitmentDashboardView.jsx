import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, CheckSquare, Calendar, Briefcase, UserPlus, 
  Clock, AlertCircle, CheckCircle, Bell, ArrowRight, Eye, ChevronRight 
} from 'lucide-react';

export const RecruitmentDashboardView = ({ setCurrentView, setSelectedCandidateId, openNewCandidateModal }) => {
  const { data, activeRole, markNotificationAsRead } = useApp();

  const candidates = data.recruitmentCandidates || [];
  const vacancies = data.recruitmentVacancies || [];
  const notifications = data.recruitmentNotifications || [];

  // KPIs
  const pendingReview = candidates.filter(c => c.status === 'Pendiente de revisión');
  const pendingFollowups = candidates.filter(c => 
    c.status === 'Información adicional solicitada' || 
    c.status === 'Seguimiento solicitado' || 
    c.status === 'Entrevista solicitada'
  );
  const interviewsScheduled = candidates.filter(c => c.status === 'Entrevista programada');
  const hiredCount = candidates.filter(c => c.status === 'Contratado').length;
  const discardedCount = candidates.filter(c => c.status === 'Descartado').length;

  // Notificaciones no leídas relevantes para el usuario
  const unreadNotifications = notifications.filter(n => !n.read);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Contratado': return { bg: '#dcfce7', color: '#15803d' };
      case 'Descartado': return { bg: '#fee2e2', color: '#b91c1c' };
      case 'Pendiente de revisión': return { bg: '#fef9c3', color: '#854d0e' };
      case 'Entrevista programada': return { bg: '#e0e7ff', color: '#3730a3' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Banner de Bienvenida y Acciones Rápidas */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#fff',
        borderRadius: '14px',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)'
      }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
            Panel de Control de Talento
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 6px 0' }}>
            Reclutamiento de Personal HRG
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, maxWidth: '600px' }}>
            Supervisión integral de aspirantes, filtro preliminar de postulaciones y toma de decisiones de contratación.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={openNewCandidateModal}
            className="btn"
            style={{
              background: '#fff',
              color: '#0369a1',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            <UserPlus size={18} /> Registrar Candidato
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principales (KPIs) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
        
        {/* KPI 1: Pendientes de Revisión (Empresa) */}
        <div 
          onClick={() => setCurrentView('candidatos')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            borderLeft: '5px solid #eab308'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              PENDIENTES DE REVISIÓN
            </span>
            <AlertCircle size={20} style={{ color: '#eab308' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#eab308', margin: '8px 0 4px 0' }}>
            {pendingReview.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Expedientes enviados esperando decisión de la Empresa.
          </div>
        </div>

        {/* KPI 2: Seguimientos Pendientes (Reclutador) */}
        <div 
          onClick={() => setCurrentView('pendientes')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            borderLeft: '5px solid #ef4444'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              SEGUIMIENTOS REQUERIDOS
            </span>
            <CheckSquare size={20} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', margin: '8px 0 4px 0' }}>
            {pendingFollowups.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Llamadas, datos y entrevistas solicitadas al Reclutador.
          </div>
        </div>

        {/* KPI 3: Entrevistas Programadas */}
        <div 
          onClick={() => setCurrentView('candidatos')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            borderLeft: '5px solid #8b5cf6'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              ENTREVISTAS PRÓXIMAS
            </span>
            <Calendar size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6', margin: '8px 0 4px 0' }}>
            {interviewsScheduled.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Citas agendadas en base o sala de entrevistas.
          </div>
        </div>

        {/* KPI 4: Contratados vs Descartados */}
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid var(--color-border)',
          borderLeft: '5px solid #16a34a'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              CONTRATADOS / DESCARTADOS
            </span>
            <CheckCircle size={20} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 4px 0' }}>
            <span style={{ color: '#16a34a' }}>{hiredCount}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', margin: '0 8px' }}>/</span>
            <span style={{ color: '#b91c1c', fontSize: '1.4rem' }}>{discardedCount}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Efectividad del embudo de contratación actual.
          </div>
        </div>

      </div>

      {/* Grid: Notificaciones Internas + Resumen por Vacante */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Notificaciones y Avisos de Flujo */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: '#0284c7' }} />
              Avisos y Solicitudes en el Flujo ({unreadNotifications.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Notificaciones dentro del sistema
            </span>
          </div>

          {unreadNotifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unreadNotifications.slice(0, 5).map(notif => (
                <div key={notif.id} style={{
                  background: 'var(--bg-main)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: notif.targetRole === 'Empresa' ? '#fef3c7' : '#e0f2fe',
                        color: notif.targetRole === 'Empresa' ? '#92400e' : '#0369a1'
                      }}>
                        Para: {notif.targetRole}
                      </span>
                      <strong style={{ fontSize: '0.82rem' }}>{notif.title}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {new Date(notif.createdAt).toLocaleString('es-MX')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {notif.candidateId && (
                      <button
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          setSelectedCandidateId(notif.candidateId);
                          setCurrentView('expediente');
                        }}
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} /> Ver
                      </button>
                    )}
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="btn btn-outline"
                      title="Marcar leída"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No tienes notificaciones pendientes. Todo al día.
            </div>
          )}
        </div>

        {/* Resumen de Vacantes Activas */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} style={{ color: '#0284c7' }} />
              Estado por Vacante
            </h3>
            <button
              onClick={() => setCurrentView('vacantes')}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            >
              Ver Todas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vacancies.slice(0, 5).map(vac => {
              const applied = candidates.filter(c => c.vacancyId === vac.id || c.vacancyTitle === vac.title).length;
              const hired = candidates.filter(c => (c.vacancyId === vac.id || c.vacancyTitle === vac.title) && c.status === 'Contratado').length;

              return (
                <div key={vac.id} style={{
                  padding: '10px 12px',
                  background: 'var(--bg-main)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{vac.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {vac.slots} plazas requeridas • {vac.location}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284c7' }}>
                      {applied} postulados
                    </span>
                    <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                      {hired} contratados
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Candidatos Recientes */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: '#0284c7' }} />
            Últimos Candidatos con Actividad
          </h3>
          <button
            onClick={() => setCurrentView('candidatos')}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Ver todos ({candidates.length}) <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Candidato</th>
                <th style={{ padding: '10px 14px' }}>Vacante</th>
                <th style={{ padding: '10px 14px' }}>Estado Actual</th>
                <th style={{ padding: '10px 14px' }}>Última Actividad</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {candidates.slice(0, 5).map(cand => {
                const badge = getStatusBadge(cand.status);
                return (
                  <tr 
                    key={cand.id} 
                    onClick={() => {
                      setSelectedCandidateId(cand.id);
                      setCurrentView('expediente');
                    }}
                    style={{ borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <strong style={{ color: 'var(--color-text-main)' }}>{cand.fullName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cand.folio} • {cand.phone}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#0284c7', fontWeight: 600 }}>
                      {cand.vacancyTitle}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color
                      }}>
                        {cand.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>
                      {new Date(cand.lastActivityAt || cand.createdAt).toLocaleString('es-MX')}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCandidateId(cand.id);
                          setCurrentView('expediente');
                        }}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        Ver Expediente
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
