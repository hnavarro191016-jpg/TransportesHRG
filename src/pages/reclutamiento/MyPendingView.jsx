import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckSquare, AlertCircle, Clock, Calendar, 
  ArrowRight, Phone, FileText, CheckCircle, Eye 
} from 'lucide-react';

export const MyPendingView = ({ onSelectCandidate }) => {
  const { data } = useApp();

  const candidates = data.recruitmentCandidates || [];
  const now = new Date();

  // Filtrar candidatos que requieren atención del reclutador
  const pendingItems = useMemo(() => {
    const list = [];

    candidates.forEach(cand => {
      // 1. Solicitudes de la Empresa pendientes de atender
      if (cand.status === 'Información adicional solicitada') {
        list.push({
          candidate: cand,
          type: 'info_adicional',
          title: 'Información Adicional Solicitada',
          detail: cand.nextAction || 'Recabar información solicitada por la empresa',
          dueDate: cand.nextActionDate ? new Date(cand.nextActionDate) : new Date(new Date(cand.lastActivityAt).getTime() + 86400000), // 24h default
          severity: 'high'
        });
      } else if (cand.status === 'Seguimiento solicitado') {
        list.push({
          candidate: cand,
          type: 'seguimiento',
          title: 'Seguimiento Solicitado por la Empresa',
          detail: cand.nextAction || 'Realizar llamada o contacto de seguimiento',
          dueDate: cand.nextActionDate ? new Date(cand.nextActionDate) : new Date(new Date(cand.lastActivityAt).getTime() + 86400000),
          severity: 'high'
        });
      } else if (cand.status === 'Entrevista solicitada') {
        list.push({
          candidate: cand,
          type: 'agendar_entrevista',
          title: 'Entrevista por Agendar',
          detail: cand.nextAction || 'Contactar al aspirante y coordinar fecha de entrevista',
          dueDate: cand.nextActionDate ? new Date(cand.nextActionDate) : new Date(new Date(cand.lastActivityAt).getTime() + 172800000), // 48h
          severity: 'medium'
        });
      } else if (cand.nextActionDate) {
        // Cualquier otro candidato con fecha compromiso fijada
        list.push({
          candidate: cand,
          type: 'compromiso',
          title: 'Fecha Compromiso Programada',
          detail: cand.nextAction || 'Seguimiento programado',
          dueDate: new Date(cand.nextActionDate),
          severity: 'normal'
        });
      }
    });

    // Ordenar por fecha de vencimiento (los más urgentes o vencidos primero)
    return list.sort((a, b) => a.dueDate - b.dueDate);
  }, [candidates]);

  // Clasificación por vencimiento
  const categorized = useMemo(() => {
    const overdue = [];
    const today = [];
    const upcoming = [];

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    pendingItems.forEach(item => {
      if (item.dueDate < startOfToday) {
        overdue.push(item);
      } else if (item.dueDate <= endOfToday) {
        today.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return { overdue, today, upcoming };
  }, [pendingItems]);

  const renderCard = (item, isOverdue = false, isToday = false) => {
    const cand = item.candidate;
    return (
      <div 
        key={`${cand.id}-${item.type}`}
        onClick={() => onSelectCandidate(cand.id)}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          padding: '16px 20px',
          border: isOverdue ? '1px solid #ef4444' : isToday ? '1px solid #f59e0b' : '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isOverdue ? '0 2px 8px rgba(239, 68, 68, 0.15)' : 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {isOverdue && (
              <span style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertCircle size={12} /> ¡VENCIDA!
              </span>
            )}
            {isToday && (
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                Vence Hoy
              </span>
            )}
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
              {item.title}
            </span>
          </div>

          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800 }}>
            {cand.fullName}
          </h4>

          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            Vacante: <strong>{cand.vacancyTitle}</strong> • Tel: {cand.phone}
          </div>

          <div style={{
            fontSize: '0.82rem',
            color: 'var(--color-text-main)',
            background: 'var(--bg-main)',
            padding: '8px 12px',
            borderRadius: '6px'
          }}>
            {item.detail}
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: isOverdue ? '#b91c1c' : 'var(--color-text-muted)' }}>
            <div style={{ fontWeight: 600 }}>Fecha límite:</div>
            <strong>{item.dueDate.toLocaleDateString('es-MX')}</strong>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectCandidate(cand.id);
            }}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px' }}
          >
            Atender <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckSquare size={26} style={{ color: '#0284c7' }} />
          Mis Pendientes de Reclutamiento
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Acciones operativas requeridas por la empresa: recabar información, realizar llamadas y agendar entrevistas.
        </p>
      </div>

      {/* Contadores Rápidos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #fca5a5',
          borderLeft: '5px solid #ef4444'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700 }}>ACCIONES VENCIDAS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
            {categorized.overdue.length}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #fde047',
          borderLeft: '5px solid #eab308'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 700 }}>COMPROMISOS DE HOY</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#854d0e', marginTop: '4px' }}>
            {categorized.today.length}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #93c5fd',
          borderLeft: '5px solid #3b82f6'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 700 }}>PRÓXIMOS DÍAS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
            {categorized.upcoming.length}
          </div>
        </div>
      </div>

      {/* Sección 1: Vencidas */}
      {categorized.overdue.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#b91c1c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> Tareas Vencidas ({categorized.overdue.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categorized.overdue.map(item => renderCard(item, true, false))}
          </div>
        </div>
      )}

      {/* Sección 2: Hoy */}
      {categorized.today.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} /> Vencen Hoy ({categorized.today.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categorized.today.map(item => renderCard(item, false, true))}
          </div>
        </div>
      )}

      {/* Sección 3: Próximas */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> Próximas Acciones ({categorized.upcoming.length})
        </h3>
        {categorized.upcoming.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categorized.upcoming.map(item => renderCard(item, false, false))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No hay más acciones pendientes programadas en este momento.
          </p>
        )}
      </div>

    </div>
  );
};
