import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, DollarSign, 
  Briefcase, CheckCircle, XCircle, AlertCircle, FileText, Send, 
  UserCheck, UserX, MessageSquare, Plus, History, Shield, Truck, 
  Wrench, Package, Radio, Lock, Eye, Edit3, Award, Car
} from 'lucide-react';

export const CandidateDetailView = ({ candidateId, onBack, onEdit }) => {
  const { 
    data, activeUser, activeRole, changeCandidateStatus, 
    addCandidateFollowup, addToast, formatMXN 
  } = useApp();

  // Selector de perspectiva para Administrador
  const [viewPerspective, setViewPerspective] = useState(() => {
    if (activeRole === 'Reclutador') return 'Reclutador';
    return 'Empresa';
  });

  // Modales de acciones
  const [activeModal, setActiveModal] = useState(null); // 'solicitar_info', 'solicitar_seguimiento', 'solicitar_entrevista', 'descartar', 'contratar', 'registrar_contacto', 'programar_entrevista', 'resultado_entrevista', 'desistimiento'
  const [modalNotes, setModalNotes] = useState('');
  const [modalDiscardReason, setModalDiscardReason] = useState('');
  const [modalHireNotes, setModalHireNotes] = useState('');
  const [modalInterviewData, setModalInterviewData] = useState({
    dateTime: '',
    interviewer: 'Jefe de Área',
    location: 'Base Romo - Sala de Juntas',
    notes: ''
  });
  const [modalFollowupData, setModalFollowupData] = useState({
    contactMedium: 'llamada',
    contactResult: 'Contactado exitosamente',
    comments: '',
    nextAction: '',
    nextActionDueDate: ''
  });

  const candidate = (data.recruitmentCandidates || []).find(c => c.id === candidateId);
  if (!candidate) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Candidato no encontrado</h3>
        <button onClick={onBack} className="btn btn-outline" style={{ marginTop: '16px' }}>
          Volver al listado
        </button>
      </div>
    );
  }

  // Filtrar historial y seguimientos
  const historyList = (data.recruitmentHistory || [])
    .filter(h => h.candidateId === candidate.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const followupsList = (data.recruitmentFollowups || [])
    .filter(f => f.candidateId === candidate.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Permisos según el rol y la perspectiva elegida
  const isSuperAdmin = activeRole === 'Administrador';
  const effectiveRole = isSuperAdmin ? viewPerspective : (activeRole || 'Reclutador');
  const canDecideAsCompany = effectiveRole === 'Empresa' || isSuperAdmin;
  const canOperateAsRecruiter = effectiveRole === 'Reclutador' || isSuperAdmin;

  // Badge de estado
  const getStatusBadge = (st) => {
    switch (st) {
      case 'Contratado':
        return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
      case 'Descartado':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      case 'Candidato desistió':
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      case 'Pendiente de revisión':
        return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
      case 'Entrevista solicitada':
      case 'Entrevista programada':
        return { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' };
      case 'Información adicional solicitada':
      case 'Seguimiento solicitado':
        return { bg: '#ffedd5', color: '#c2410c', border: '#fdba74' };
      case 'En evaluación':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  const badgeStyle = getStatusBadge(candidate.status);

  // MANEJADORES DE ACCIONES DE LA EMPRESA
  const handleCompanyAction = async (actionType) => {
    if (actionType === 'descartar') {
      if (!modalDiscardReason.trim()) {
        addToast('El motivo interno de descarte es obligatorio', 'warning');
        return;
      }
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Descartado',
        notes: `Candidato descartado. Motivo interno: ${modalDiscardReason}`,
        actorName: activeUser?.name || 'Comité Evaluador',
        actorRole: 'Empresa',
        isInternal: true,
        discardReason: modalDiscardReason,
        nextAction: 'Proceso cerrado (Descartado)'
      });
    } else if (actionType === 'contratar') {
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Contratado',
        notes: modalHireNotes || 'Candidato seleccionado y aprobado para contratación.',
        actorName: activeUser?.name || 'Comité Evaluador',
        actorRole: 'Empresa',
        isInternal: false,
        hireNotes: modalHireNotes,
        nextAction: 'Coordinar ingreso formal en Recursos Humanos'
      });
    } else if (actionType === 'solicitar_info') {
      if (!modalNotes.trim()) {
        addToast('Por favor describe qué información necesitas que recabe el reclutador', 'warning');
        return;
      }
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Información adicional solicitada',
        notes: modalNotes,
        actorName: activeUser?.name || 'Comité Evaluador',
        actorRole: 'Empresa',
        isInternal: false,
        nextAction: `Reclutador: Recabar información solicitada (${modalNotes.substring(0, 50)}...)`
      });
    } else if (actionType === 'solicitar_seguimiento') {
      if (!modalNotes.trim()) {
        addToast('Por favor detalla qué seguimiento debe realizar el reclutador', 'warning');
        return;
      }
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Seguimiento solicitado',
        notes: modalNotes,
        actorName: activeUser?.name || 'Comité Evaluador',
        actorRole: 'Empresa',
        isInternal: false,
        nextAction: `Reclutador: Ejecutar seguimiento (${modalNotes.substring(0, 50)}...)`
      });
    } else if (actionType === 'solicitar_entrevista') {
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Entrevista solicitada',
        notes: modalNotes || 'Perfil autorizado para entrevista. Programar cita presencial o virtual.',
        actorName: activeUser?.name || 'Comité Evaluador',
        actorRole: 'Empresa',
        isInternal: false,
        nextAction: 'Reclutador: Agendar fecha y hora de entrevista con el aspirante'
      });
    }
    setActiveModal(null);
    setModalNotes('');
    setModalDiscardReason('');
    setModalHireNotes('');
  };

  // MANEJADORES DE ACCIONES DEL RECLUTADOR
  const handleRecruiterAction = async (actionType) => {
    if (actionType === 'enviar_revision') {
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Pendiente de revisión',
        notes: modalNotes || 'Expediente actualizado y enviado a revisión de la empresa.',
        actorName: activeUser?.name || 'Reclutador Romo',
        actorRole: 'Reclutador',
        isInternal: false,
        nextAction: 'Revisión por parte de la Empresa'
      });
    } else if (actionType === 'registrar_contacto') {
      if (!modalFollowupData.contactResult) {
        addToast('Selecciona el resultado del contacto', 'warning');
        return;
      }
      await addCandidateFollowup(candidate.id, modalFollowupData);
    } else if (actionType === 'enviar_info_adicional') {
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Pendiente de revisión',
        notes: `Información adicional agregada: ${modalNotes}`,
        actorName: activeUser?.name || 'Reclutador Romo',
        actorRole: 'Reclutador',
        isInternal: false,
        nextAction: 'Empresa: Evaluar información complementaria'
      });
    } else if (actionType === 'programar_entrevista') {
      if (!modalInterviewData.dateTime) {
        addToast('Indica la fecha y hora de la entrevista', 'warning');
        return;
      }
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Entrevista programada',
        notes: `Entrevista agendada para el ${new Date(modalInterviewData.dateTime).toLocaleString('es-MX')} en ${modalInterviewData.location}. Entrevistador: ${modalInterviewData.interviewer}. ${modalInterviewData.notes}`,
        actorName: activeUser?.name || 'Reclutador Romo',
        actorRole: 'Reclutador',
        isInternal: false,
        metadata: modalInterviewData,
        nextAction: `Realizar entrevista el ${new Date(modalInterviewData.dateTime).toLocaleDateString('es-MX')}`,
        nextActionDate: modalInterviewData.dateTime
      });
    } else if (actionType === 'resultado_entrevista') {
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'En evaluación',
        notes: `Resultado de entrevista: ${modalNotes}`,
        actorName: activeUser?.name || 'Reclutador Romo',
        actorRole: 'Reclutador',
        isInternal: false,
        nextAction: 'Empresa: Decisión final de contratación o descarte'
      });
    } else if (actionType === 'desistimiento') {
      if (!modalNotes.trim()) {
        addToast('Indica el motivo del desistimiento', 'warning');
        return;
      }
      await changeCandidateStatus({
        candidateId: candidate.id,
        newStatus: 'Candidato desistió',
        notes: `Candidato desistió del proceso: ${modalNotes}`,
        actorName: activeUser?.name || 'Reclutador Romo',
        actorRole: 'Reclutador',
        isInternal: false,
        nextAction: 'Proceso cancelado por desistimiento'
      });
    }
    setActiveModal(null);
    setModalNotes('');
  };

  // Render específico según vacante
  const currentTitleLower = (candidate.vacancyTitle || '').toLowerCase();
  const isGuardia = currentTitleLower.includes('guardia') || currentTitleLower.includes('seguridad');
  const isTaller = currentTitleLower.includes('taller') || currentTitleLower.includes('mecánico') || currentTitleLower.includes('mecanico');
  const isAlmacen = currentTitleLower.includes('almacén') || currentTitleLower.includes('almacen');
  const isMonitorista = currentTitleLower.includes('monitorista') || currentTitleLower.includes('gps') || currentTitleLower.includes('telemetría');
  const isOperador = currentTitleLower.includes('operador') || currentTitleLower.includes('tráiler') || currentTitleLower.includes('trailer') || currentTitleLower.includes('chofer');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Barra Superior de Navegación y Acciones Rápidas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBack}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={18} /> Volver al listado
        </button>

        {/* Selector de Perspectiva si es Administrador */}
        {isSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Probar como:</span>
            <button
              onClick={() => setViewPerspective('Reclutador')}
              style={{
                background: viewPerspective === 'Reclutador' ? '#0284c7' : 'transparent',
                color: viewPerspective === 'Reclutador' ? '#fff' : 'var(--color-text-main)',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reclutador
            </button>
            <button
              onClick={() => setViewPerspective('Empresa')}
              style={{
                background: viewPerspective === 'Empresa' ? '#16a34a' : 'transparent',
                color: viewPerspective === 'Empresa' ? '#fff' : 'var(--color-text-main)',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Empresa (Evaluador)
            </button>
          </div>
        )}

        <button
          onClick={() => onEdit(candidate)}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <Edit3 size={16} /> Editar Datos
        </button>
      </div>

      {/* Header del Expediente */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid var(--color-border)',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800
          }}>
            {candidate.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{candidate.fullName}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                [{candidate.folio}]
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#0284c7', fontWeight: 600 }}>
                <Briefcase size={16} /> {candidate.vacancyTitle}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <MapPin size={15} /> {candidate.city} {candidate.neighborhood ? `(${candidate.neighborhood})` : ''}
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Registrado: {new Date(candidate.createdAt).toLocaleDateString('es-MX')}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 800,
            background: badgeStyle.bg,
            color: badgeStyle.color,
            border: `1px solid ${badgeStyle.border}`
          }}>
            {candidate.status}
          </span>
          {candidate.nextAction && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', maxWidth: '280px', marginTop: '4px' }}>
              <strong>Próxima acción:</strong> {candidate.nextAction}
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE BOTONES DE ACCIÓN SEGÚN EL ROL */}
      <div style={{
        background: 'var(--bg-main)',
        borderRadius: '12px',
        padding: '18px 24px',
        border: '1px solid var(--color-border)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Flujo de Trabajo:</span>
            <span style={{
              background: canDecideAsCompany ? 'rgba(22, 163, 74, 0.15)' : 'rgba(2, 132, 199, 0.15)',
              color: canDecideAsCompany ? '#16a34a' : '#0284c7',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem'
            }}>
              Acciones permitidas como: {effectiveRole}
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {canDecideAsCompany 
              ? 'La empresa decide si solicita información, entrevista, descarta o contrata.' 
              : 'El reclutador ejecuta los contactos, recaba datos y agenda entrevistas.'}
          </div>
        </div>

        {/* Botones de la EMPRESA */}
        {canDecideAsCompany && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveModal('solicitar_info')}
              className="btn btn-outline"
              style={{ borderColor: '#f59e0b', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <FileText size={16} /> Solicitar Información
            </button>

            <button
              onClick={() => setActiveModal('solicitar_seguimiento')}
              className="btn btn-outline"
              style={{ borderColor: '#3b82f6', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Phone size={16} /> Solicitar Seguimiento
            </button>

            <button
              onClick={() => setActiveModal('solicitar_entrevista')}
              className="btn btn-outline"
              style={{ borderColor: '#8b5cf6', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Calendar size={16} /> Solicitar Entrevista
            </button>

            <button
              onClick={() => setActiveModal('descartar')}
              className="btn btn-outline"
              style={{ borderColor: '#ef4444', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <UserX size={16} /> Descartar Candidato
            </button>

            <button
              onClick={() => setActiveModal('contratar')}
              className="btn btn-primary"
              style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <UserCheck size={16} /> Marcar como Contratado
            </button>
          </div>
        )}

        {/* Botones del RECLUTADOR */}
        {canOperateAsRecruiter && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: canDecideAsCompany ? '12px' : '0' }}>
            {candidate.status === 'Borrador' && (
              <button
                onClick={() => handleRecruiterAction('enviar_revision')}
                className="btn btn-primary"
                style={{ background: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Send size={16} /> Enviar a Revisión de la Empresa
              </button>
            )}

            <button
              onClick={() => setActiveModal('registrar_contacto')}
              className="btn btn-dark"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Phone size={16} /> Registrar Contacto / Intento
            </button>

            {candidate.status === 'Información adicional solicitada' && (
              <button
                onClick={() => setActiveModal('enviar_info_adicional')}
                className="btn btn-primary"
                style={{ background: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <FileText size={16} /> Enviar Información Adicional
              </button>
            )}

            {(candidate.status === 'Entrevista solicitada' || candidate.status === 'Seguimiento solicitado') && (
              <button
                onClick={() => setActiveModal('programar_entrevista')}
                className="btn btn-outline"
                style={{ borderColor: '#8b5cf6', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Calendar size={16} /> Programar Entrevista
              </button>
            )}

            {candidate.status === 'Entrevista programada' && (
              <button
                onClick={() => setActiveModal('resultado_entrevista')}
                className="btn btn-outline"
                style={{ borderColor: '#16a34a', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Award size={16} /> Registrar Resultado de Entrevista
              </button>
            )}

            <button
              onClick={() => setActiveModal('desistimiento')}
              className="btn btn-outline"
              style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}
            >
              Registrar Desistimiento
            </button>
          </div>
        )}
      </div>

      {/* Grid Principal: Ficha Técnica + Historial/Seguimientos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        
        {/* COLUMNA IZQUIERDA: DETALLES DEL CANDIDATO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card: Contacto y Residencia */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={16} /> Contacto y Residencia
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Teléfono Principal:</span>
                <strong>{candidate.phone}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>WhatsApp:</span>
                <strong>{candidate.whatsapp || 'No registrado'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Correo Electrónico:</span>
                <span>{candidate.email || 'No proporcionado'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Medio de Llegada:</span>
                <span style={{ textTransform: 'capitalize' }}>{candidate.source} {candidate.sourceDetails ? `(${candidate.sourceDetails})` : ''}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Ubicación:</span>
                <span>{candidate.city}, {candidate.municipality || ''} {candidate.neighborhood ? `• Col. ${candidate.neighborhood}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Card: Interés, Disponibilidad y Transporte */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={16} /> Disponibilidad y Condiciones
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Ingreso Disponible:</span>
                <strong>{candidate.entryAvailability}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Expectativa Salarial:</span>
                <strong style={{ color: '#16a34a' }}>
                  {candidate.salaryExpectation ? `${formatMXN(candidate.salaryExpectation)} (${candidate.salaryPeriod})` : 'A convenir'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Medio de Transporte:</span>
                <span>{candidate.transportMode}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Otras Vacantes de Interés:</span>
                <span>{candidate.secondaryVacancies?.length > 0 ? candidate.secondaryVacancies.join(', ') : 'Ninguna otra'}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Disponibilidad de horarios / turnos / viajes:</span>
                <span>{candidate.scheduleAvailability || 'Sin restricciones reportadas'}</span>
              </div>
            </div>
          </div>

          {/* Card: Campos Específicos según Vacante */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isGuardia && <Shield size={16} />}
              {isTaller && <Wrench size={16} />}
              {isAlmacen && <Package size={16} />}
              {isMonitorista && <Radio size={16} />}
              {isOperador && <Truck size={16} />}
              Campos Específicos para: {candidate.vacancyTitle}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.85rem' }}>
              {isOperador && (
                <>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Licencia Federal:</span> <strong>{candidate.specificFields?.licenseType || 'No indicada'}</strong></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Vigencia Licencia/Apto Médico:</span> <strong>{candidate.specificFields?.licenseExpiry || 'No indicada'}</strong></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Años en Quinta Rueda:</span> <span>{candidate.specificFields?.drivingExperience || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Unidades Manejadas:</span> <span>{candidate.specificFields?.unitsOperated || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Rutas Cubiertas:</span> <span>{candidate.specificFields?.routesCovered || '-'}</span></div>
                </>
              )}

              {isGuardia && (
                <>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Experiencia Vigilancia:</span> <span>{candidate.specificFields?.surveillanceExperience || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Control de Accesos:</span> <span>{candidate.specificFields?.accessControl || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Rondines y Bastón Sensor:</span> <span>{candidate.specificFields?.roundsPatrols || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Elaboración de Reportes:</span> <span>{candidate.specificFields?.reportsWriting || '-'}</span></div>
                </>
              )}

              {isTaller && (
                <>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Especialidad Mecánica:</span> <span>{candidate.specificFields?.specialty || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Equipos/Motores Atendidos:</span> <span>{candidate.specificFields?.equipmentHandled || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Diagnóstico y Herramientas:</span> <span>{candidate.specificFields?.technicalKnowledge || '-'}</span></div>
                </>
              )}

              {isAlmacen && (
                <>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Control de Inventarios:</span> <span>{candidate.specificFields?.inventoryExperience || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Entradas y Salidas:</span> <span>{candidate.specificFields?.receivingShipping || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Sistemas ERP Utilizados:</span> <span>{candidate.specificFields?.systemsUsed || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Manejo de Montacargas:</span> <span>{candidate.specificFields?.forkliftOperation || 'No'}</span></div>
                </>
              )}

              {isMonitorista && (
                <>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Plataformas GPS:</span> <span>{candidate.specificFields?.gpsPlatforms || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Monitoreo en Carretera:</span> <span>{candidate.specificFields?.fleetTracking || '-'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Atención de Incidentes / Botón Pánico:</span> <span>{candidate.specificFields?.incidentResponse || '-'}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Card: Trayectoria Laboral y Escolaridad */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Experiencia y Empleos Anteriores
            </h4>

            <div style={{ marginBottom: '14px', fontSize: '0.85rem', display: 'flex', gap: '20px' }}>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Escolaridad:</span> <strong>{candidate.education}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Experiencia Relacionada:</span> <strong>{candidate.yearsExperience} años</strong></div>
            </div>

            {candidate.employmentHistory?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {candidate.employmentHistory.map((job, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      <span>{job.position || 'Puesto no especificado'}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{job.duration}</span>
                    </div>
                    <div style={{ color: '#0284c7', fontSize: '0.8rem', marginTop: '2px' }}>{job.employer}</div>
                    {job.activities && (
                      <div style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '0.78rem' }}>
                        {job.activities}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>Sin empleos registrados.</p>
            )}

            {candidate.skillsCertifications && (
              <div style={{ marginTop: '14px', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block' }}>Habilidades y Cursos:</span>
                <p style={{ margin: '4px 0 0 0' }}>{candidate.skillsCertifications}</p>
              </div>
            )}

            {candidate.recruiterNotes && (
              <div style={{ marginTop: '14px', fontSize: '0.83rem', background: 'rgba(2, 132, 199, 0.05)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, display: 'block' }}>Observaciones del Reclutador:</span>
                <p style={{ margin: '4px 0 0 0' }}>{candidate.recruiterNotes}</p>
              </div>
            )}
          </div>

          {/* Card: Consentimiento y Protección de Datos */}
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '10px',
            padding: '16px 20px',
            border: '1px solid #86efac',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem'
          }}>
            <CheckCircle size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#16a34a' }}>Consentimiento Otorgado</strong>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                El candidato autorizó formalmente compartir su perfil con el comité evaluador de la empresa el {new Date(candidate.consentDate || candidate.createdAt).toLocaleString('es-MX')}.
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: SEGUIMIENTOS Y HISTORIAL CRONOLÓGICO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card: Registro de Contactos / Seguimientos */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={16} /> Bitácora de Contacto ({followupsList.length})
              </h4>
              {canOperateAsRecruiter && (
                <button
                  onClick={() => setActiveModal('registrar_contacto')}
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} /> Registrar
                </button>
              )}
            </div>

            {followupsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {followupsList.map(foll => (
                  <div key={foll.id} style={{
                    background: 'var(--bg-main)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid var(--color-border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: foll.contactResult === 'Contactado exitosamente' ? '#16a34a' : '#d97706',
                        background: foll.contactResult === 'Contactado exitosamente' ? '#dcfce7' : '#fef3c7',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {foll.contactResult}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {new Date(foll.followupDate).toLocaleString('es-MX')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', marginBottom: '4px' }}>
                      {foll.comments || 'Sin comentarios registrados.'}
                    </div>

                    {foll.nextAction && (
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '6px', borderTop: '1px dashed var(--color-border)', paddingTop: '4px' }}>
                        <strong>Próxima acción:</strong> {foll.nextAction} 
                        {foll.nextActionDueDate && ` (Compromiso: ${new Date(foll.nextActionDueDate).toLocaleDateString('es-MX')})`}
                      </div>
                    )}

                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
                      Registrado por: {foll.createdBy}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', margin: 0 }}>
                No hay intentos ni llamadas registradas aún.
              </p>
            )}
          </div>

          {/* Card: Historial Cronológico de Estados (Audit Trail) */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', padding: '20px', border: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} /> Historial Cronológico y Auditoría
            </h4>

            <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--color-border)' }}>
              {historyList.map((hist, index) => {
                // Si la nota es interna de la empresa y el rol es puramente Reclutador, no la mostramos si no es admin
                const isHiddenFromRecruiter = hist.internalOnly && activeRole === 'Reclutador' && !isSuperAdmin;
                if (isHiddenFromRecruiter) return null;

                return (
                  <div key={hist.id} style={{ marginBottom: '18px', position: 'relative' }}>
                    {/* Bullet */}
                    <div style={{
                      position: 'absolute',
                      left: '-23px',
                      top: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: hist.internalOnly ? '#ef4444' : '#0284c7',
                      border: '2px solid var(--bg-surface)'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {hist.newStatus ? `Cambio a: ${hist.newStatus}` : hist.actionType}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {new Date(hist.createdAt).toLocaleString('es-MX')}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Por: <strong>{hist.actorName}</strong> ({hist.actorRole})
                      {hist.internalOnly && (
                        <span style={{ marginLeft: '6px', color: '#b91c1c', fontWeight: 700 }}>
                          [Nota Interna Empresa]
                        </span>
                      )}
                    </div>

                    {hist.notes && (
                      <div style={{
                        background: hist.internalOnly ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-main)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-main)',
                        borderLeft: hist.internalOnly ? '3px solid #ef4444' : '3px solid #0284c7'
                      }}>
                        {hist.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* MODALES FLOTANTES SEGÚN LA ACCIÓN */}
      {activeModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            
            {/* Modal: Solicitar Información */}
            {activeModal === 'solicitar_info' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>
                  Solicitar Información Adicional
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Indica qué datos, referencias o documentos requieres que el reclutador solicite al aspirante:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Ej. Se requiere constancia de vigencia de licencia federal y comprobante de cartas de recomendación de los últimos 2 empleos..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleCompanyAction('solicitar_info')} className="btn btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
                    Enviar Solicitud al Reclutador
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Solicitar Seguimiento */}
            {activeModal === 'solicitar_seguimiento' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#1d4ed8' }}>
                  Solicitar Seguimiento al Reclutador
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Especifica qué acción de seguimiento o aclaración debe efectuar el reclutador:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Ej. Marcar nuevamente para corroborar si cuenta con disponibilidad para turno nocturno 12x12 este fin de semana..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleCompanyAction('solicitar_seguimiento')} className="btn btn-primary" style={{ background: '#1d4ed8', borderColor: '#1d4ed8' }}>
                    Solicitar Seguimiento
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Solicitar Entrevista */}
            {activeModal === 'solicitar_entrevista' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#6d28d9' }}>
                  Autorizar / Solicitar Entrevista
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  El perfil fue aprobado preliminarmente. Indica al reclutador los lineamientos de la entrevista:
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Ej. Programar entrevista presencial con Jefe de Taller en patio matriz. Evaluar conocimientos en cajas Fuller."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleCompanyAction('solicitar_entrevista')} className="btn btn-primary" style={{ background: '#6d28d9', borderColor: '#6d28d9' }}>
                    Solicitar Entrevista
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Descartar Candidato */}
            {activeModal === 'descartar' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c' }}>
                  Descartar Candidato
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Registra el motivo interno de la decisión. Este motivo queda resguardado internamente y no se notifica al candidato:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Ej. No cumple con la experiencia requerida en tractocamión full / Incompatibilidad con turnos rotativos..."
                  value={modalDiscardReason}
                  onChange={e => setModalDiscardReason(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleCompanyAction('descartar')} className="btn btn-primary" style={{ background: '#b91c1c', borderColor: '#b91c1c' }}>
                    Confirmar Descarte
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Contratar Candidato */}
            {activeModal === 'contratar' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                  Aprobar Contratación
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Confirmar que el aspirante es seleccionado para ocupar la plaza de <strong>{candidate.vacancyTitle}</strong>:
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Notas de contratación, fecha tentativa de firma o condiciones acordadas..."
                  value={modalHireNotes}
                  onChange={e => setModalHireNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleCompanyAction('contratar')} className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                    Confirmar Contratación
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Registrar Contacto / Intento */}
            {activeModal === 'registrar_contacto' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  Registrar Contacto o Intento
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Medio de Contacto</label>
                    <select
                      className="form-control"
                      value={modalFollowupData.contactMedium}
                      onChange={e => setModalFollowupData({ ...modalFollowupData, contactMedium: e.target.value })}
                    >
                      <option value="llamada">Llamada telefónica</option>
                      <option value="whatsapp">Mensaje WhatsApp</option>
                      <option value="presencial">Presencial en base</option>
                      <option value="correo">Correo electrónico</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Resultado del Contacto *</label>
                    <select
                      className="form-control"
                      value={modalFollowupData.contactResult}
                      onChange={e => setModalFollowupData({ ...modalFollowupData, contactResult: e.target.value })}
                    >
                      <option value="Contactado exitosamente">Contactado exitosamente</option>
                      <option value="No contestó">No contestó</option>
                      <option value="Buzón de voz">Buzón de voz</option>
                      <option value="Ocupado / Volver a llamar">Ocupado / Volver a llamar</option>
                      <option value="Número equivocado / Fuera de servicio">Número equivocado / Fuera de servicio</option>
                      <option value="Pidió tiempo para decidir">Pidió tiempo para decidir</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Comentarios y Detalles</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Resumen de la llamada o lo respondido por el aspirante..."
                      value={modalFollowupData.comments}
                      onChange={e => setModalFollowupData({ ...modalFollowupData, comments: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Próxima Acción Acordada</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Volver a marcar mañana a las 11:00 am"
                      value={modalFollowupData.nextAction}
                      onChange={e => setModalFollowupData({ ...modalFollowupData, nextAction: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Fecha Compromiso de la Próxima Acción</label>
                    <input
                      type="date"
                      className="form-control"
                      value={modalFollowupData.nextActionDueDate}
                      onChange={e => setModalFollowupData({ ...modalFollowupData, nextActionDueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleRecruiterAction('registrar_contacto')} className="btn btn-primary">
                    Guardar Contacto
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Programar Entrevista */}
            {activeModal === 'programar_entrevista' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#6d28d9' }}>
                  Agendar Entrevista
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Fecha y Hora de la Entrevista *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      required
                      value={modalInterviewData.dateTime}
                      onChange={e => setModalInterviewData({ ...modalInterviewData, dateTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Entrevistador / Responsable</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Ing. Carlos Mendoza (Jefe de Taller)"
                      value={modalInterviewData.interviewer}
                      onChange={e => setModalInterviewData({ ...modalInterviewData, interviewer: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Lugar o Modalidad</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Base Romo - Sala de Juntas / Videollamada"
                      value={modalInterviewData.location}
                      onChange={e => setModalInterviewData({ ...modalInterviewData, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Indicaciones al Aspirante</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Ej. Presentarse con cartas de recomendación en caseta principal..."
                      value={modalInterviewData.notes}
                      onChange={e => setModalInterviewData({ ...modalInterviewData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleRecruiterAction('programar_entrevista')} className="btn btn-primary" style={{ background: '#6d28d9', borderColor: '#6d28d9' }}>
                    Agendar Entrevista
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Resultado de Entrevista */}
            {activeModal === 'resultado_entrevista' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#16a34a' }}>
                  Registrar Resultado de Entrevista
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Ingresa las conclusiones de la entrevista realizada para someter a decisión final de la Empresa:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Ej. El candidato acudió puntual, demostró sólidos conocimientos en cajas Eaton Fuller y aprobó prueba de manejo..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleRecruiterAction('resultado_entrevista')} className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                    Guardar y Enviar a Evaluación
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Desistimiento */}
            {activeModal === 'desistimiento' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800 }}>
                  Registrar Desistimiento del Candidato
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Indica la razón por la cual el aspirante decidió no continuar con el proceso:
                </p>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  placeholder="Ej. Aceptó otra oferta laboral más cercana a su domicilio..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleRecruiterAction('desistimiento')} className="btn btn-dark">
                    Guardar Desistimiento
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Enviar Información Adicional */}
            {activeModal === 'enviar_info_adicional' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                  Enviar Información Adicional Recabada
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Detalla la información solicitada que obtuviste del aspirante:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  placeholder="Ej. Se confirmaron referencias con su último patrón Don Rogelio Martínez, reporte positivo. Confirmó vigencia de licencia al 2027..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setActiveModal(null)} className="btn btn-outline">Cancelar</button>
                  <button onClick={() => handleRecruiterAction('enviar_info_adicional')} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                    Enviar a la Empresa
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
