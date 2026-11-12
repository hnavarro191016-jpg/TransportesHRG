import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, User, Phone, Mail, MapPin, Briefcase, Calendar, DollarSign, 
  Car, GraduationCap, Award, FileText, AlertTriangle, CheckCircle, 
  Plus, Trash2, Shield, Wrench, Package, Radio, Truck
} from 'lucide-react';

export const CandidateFormModal = ({ isOpen, onClose, candidateToEdit = null, onSaved = null }) => {
  const { data, activeUser, activeRole, addRecruitmentCandidate, updateRecruitmentCandidate, checkCandidateDuplicate, addToast } = useApp();
  
  const vacancies = (data.recruitmentVacancies || []).filter(v => v.status !== 'cerrada');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    email: '',
    city: '',
    municipality: '',
    neighborhood: '',
    source: 'anuncio',
    sourceDetails: '',
    vacancyId: '',
    vacancyTitle: '',
    secondaryVacancies: [],
    entryAvailability: 'Inmediata',
    scheduleAvailability: '',
    salaryExpectation: '',
    salaryPeriod: 'semanal',
    transportMode: 'transporte_publico',
    education: 'Preparatoria',
    yearsExperience: 1,
    employmentHistory: [
      { employer: '', position: '', activities: '', duration: '' }
    ],
    skillsCertifications: '',
    recruiterNotes: '',
    specificFields: {},
    consentShareProfile: false,
    resumeUrl: ''
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (candidateToEdit) {
      setFormData({
        fullName: candidateToEdit.fullName || '',
        phone: candidateToEdit.phone || '',
        whatsapp: candidateToEdit.whatsapp || '',
        email: candidateToEdit.email || '',
        city: candidateToEdit.city || '',
        municipality: candidateToEdit.municipality || '',
        neighborhood: candidateToEdit.neighborhood || '',
        source: candidateToEdit.source || 'anuncio',
        sourceDetails: candidateToEdit.sourceDetails || '',
        vacancyId: candidateToEdit.vacancyId || '',
        vacancyTitle: candidateToEdit.vacancyTitle || '',
        secondaryVacancies: candidateToEdit.secondaryVacancies || [],
        entryAvailability: candidateToEdit.entryAvailability || 'Inmediata',
        scheduleAvailability: candidateToEdit.scheduleAvailability || '',
        salaryExpectation: candidateToEdit.salaryExpectation || '',
        salaryPeriod: candidateToEdit.salaryPeriod || 'semanal',
        transportMode: candidateToEdit.transportMode || 'transporte_publico',
        education: candidateToEdit.education || 'Preparatoria',
        yearsExperience: candidateToEdit.yearsExperience || 0,
        employmentHistory: candidateToEdit.employmentHistory?.length > 0 
          ? candidateToEdit.employmentHistory 
          : [{ employer: '', position: '', activities: '', duration: '' }],
        skillsCertifications: candidateToEdit.skillsCertifications || '',
        recruiterNotes: candidateToEdit.recruiterNotes || '',
        specificFields: candidateToEdit.specificFields || {},
        consentShareProfile: candidateToEdit.consentShareProfile || false,
        resumeUrl: candidateToEdit.resumeUrl || ''
      });
    } else {
      // Default to first vacancy if available
      const defaultVac = vacancies[0];
      setFormData({
        fullName: '',
        phone: '',
        whatsapp: '',
        email: '',
        city: 'Monterrey',
        municipality: '',
        neighborhood: '',
        source: 'anuncio',
        sourceDetails: '',
        vacancyId: defaultVac?.id || '',
        vacancyTitle: defaultVac?.title || '',
        secondaryVacancies: [],
        entryAvailability: 'Inmediata',
        scheduleAvailability: 'Disponibilidad total de horario',
        salaryExpectation: '',
        salaryPeriod: 'semanal',
        transportMode: 'transporte_publico',
        education: 'Preparatoria',
        yearsExperience: 2,
        employmentHistory: [
          { employer: '', position: '', activities: '', duration: '' }
        ],
        skillsCertifications: '',
        recruiterNotes: '',
        specificFields: {},
        consentShareProfile: false,
        resumeUrl: ''
      });
    }
  }, [candidateToEdit, isOpen]);

  // Validar duplicados en tiempo real
  useEffect(() => {
    if (!formData.phone && !formData.email) {
      setDuplicateWarning(null);
      return;
    }
    const check = checkCandidateDuplicate(formData.phone, formData.email, candidateToEdit?.id);
    if (check.isDuplicate) {
      setDuplicateWarning(`Posible duplicado detectado por ${check.matchedField}: "${check.existingCandidate.fullName}" (${check.existingCandidate.folio} - Vacante: ${check.existingCandidate.vacancyTitle})`);
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.phone, formData.email]);

  if (!isOpen) return null;

  const handleVacancyChange = (vacId) => {
    const selected = vacancies.find(v => v.id === vacId);
    setFormData(prev => ({
      ...prev,
      vacancyId: vacId,
      vacancyTitle: selected ? selected.title : '',
      // Reseteamos campos específicos para llenar los pertinentes
      specificFields: {}
    }));
  };

  const handleAddJob = () => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: [
        ...prev.employmentHistory,
        { employer: '', position: '', activities: '', duration: '' }
      ]
    }));
  };

  const handleRemoveJob = (index) => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: prev.employmentHistory.filter((_, i) => i !== index)
    }));
  };

  const handleJobChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.employmentHistory];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, employmentHistory: updated };
    });
  };

  const handleSpecificFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      specificFields: {
        ...prev.specificFields,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (submitStatus) => {
    if (!formData.fullName.trim()) {
      addToast('El nombre completo es obligatorio', 'warning');
      return;
    }
    if (!formData.phone.trim()) {
      addToast('El teléfono de contacto es obligatorio', 'warning');
      return;
    }
    if (!formData.vacancyTitle) {
      addToast('Selecciona la vacante principal de postulación', 'warning');
      return;
    }
    if (!formData.consentShareProfile) {
      addToast('El candidato debe otorgar autorización expresa para compartir su perfil con la empresa', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: submitStatus,
        assignedRecruiter: activeUser?.name || 'Reclutador Romo',
        consentDate: formData.consentShareProfile ? new Date().toISOString() : null,
        nextAction: submitStatus === 'Pendiente de revisión' 
          ? 'Revisión y decisión por parte del comité de la Empresa' 
          : 'Completar datos pendientes del reclutador',
        salaryExpectation: Number(formData.salaryExpectation) || 0,
        yearsExperience: Number(formData.yearsExperience) || 0
      };

      if (candidateToEdit) {
        await updateRecruitmentCandidate(candidateToEdit.id, payload);
      } else {
        await addRecruitmentCandidate(payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Error al registrar candidato', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Identificador de tipo de vacante para renderizar campos específicos
  const currentTitleLower = (formData.vacancyTitle || '').toLowerCase();
  const isGuardia = currentTitleLower.includes('guardia') || currentTitleLower.includes('seguridad');
  const isTaller = currentTitleLower.includes('taller') || currentTitleLower.includes('mecánico') || currentTitleLower.includes('mecanico');
  const isAlmacen = currentTitleLower.includes('almacén') || currentTitleLower.includes('almacen');
  const isMonitorista = currentTitleLower.includes('monitorista') || currentTitleLower.includes('gps') || currentTitleLower.includes('telemetría');
  const isOperador = currentTitleLower.includes('operador') || currentTitleLower.includes('tráiler') || currentTitleLower.includes('trailer') || currentTitleLower.includes('chofer');

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Header Modal */}
        <div style={{
          background: 'var(--bg-main)',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={22} style={{ color: '#0284c7' }} />
              {candidateToEdit ? `Editar Expediente: ${candidateToEdit.fullName}` : 'Registro de Nuevo Candidato'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Captura estructurada de aspirante. En esta fase no se recaban datos sensibles bancarios ni médicos.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Alerta de duplicados */}
        {duplicateWarning && (
          <div style={{
            background: '#fffbeb',
            borderLeft: '4px solid #f59e0b',
            color: '#92400e',
            padding: '12px 20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* Cuerpo del formulario scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* SECCIÓN 1: DATOS DE CONTACTO */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              color: '#0284c7', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              borderBottom: '1px solid var(--color-border-subtle)',
              paddingBottom: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Phone size={16} /> 1. Datos de Contacto y Residencia
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Nombre Completo *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Martín Hernández Valero"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Teléfono Principal *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Ej. 81 1234 5678"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>WhatsApp</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Ej. 81 1234 5678"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="candidato@correo.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Ciudad / Estado *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Monterrey, N.L."
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Municipio</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Apodaca / Escobedo"
                  value={formData.municipality}
                  onChange={e => setFormData({ ...formData, municipality: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Colonia o Zona de Residencia</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Huinalá / Sector Centro"
                  value={formData.neighborhood}
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Medio por el que llegó</label>
                <select
                  className="form-control"
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="recomendación">Recomendación interna / Chofer</option>
                  <option value="redes sociales">Redes sociales (Facebook, etc.)</option>
                  <option value="anuncio">Anuncio en lona / Base</option>
                  <option value="bolsa de trabajo">Bolsa de trabajo / OCC / Indeed</option>
                  <option value="otro">Otro medio</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Detalle de fuente (Quién recomendó o qué anuncio)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Recomendado por Chofer Pedro Sánchez de Unidad 102"
                  value={formData.sourceDetails}
                  onChange={e => setFormData({ ...formData, sourceDetails: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: INTERÉS Y DISPONIBILIDAD */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              color: '#0284c7', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              borderBottom: '1px solid var(--color-border-subtle)',
              paddingBottom: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Briefcase size={16} /> 2. Posición de Interés y Disponibilidad
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Vacante Principal *</label>
                <select
                  className="form-control"
                  required
                  value={formData.vacancyId}
                  onChange={e => handleVacancyChange(e.target.value)}
                >
                  <option value="">-- Seleccionar Vacante --</option>
                  {vacancies.map(v => (
                    <option key={v.id} value={v.id}>{v.title} ({v.department} - {v.slots} plazas)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Disponibilidad para Ingresar</label>
                <select
                  className="form-control"
                  value={formData.entryAvailability}
                  onChange={e => setFormData({ ...formData, entryAvailability: e.target.value })}
                >
                  <option value="Inmediata">Inmediata</option>
                  <option value="1 semana">1 semana</option>
                  <option value="15 días">15 días</option>
                  <option value="1 mes">1 mes</option>
                  <option value="A negociar">A negociar</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Expectativa Salarial</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Monto en $"
                    value={formData.salaryExpectation}
                    onChange={e => setFormData({ ...formData, salaryExpectation: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-control"
                    style={{ width: '130px' }}
                    value={formData.salaryPeriod}
                    onChange={e => setFormData({ ...formData, salaryPeriod: e.target.value })}
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Medio de Transporte para llegar</label>
                <select
                  className="form-control"
                  value={formData.transportMode}
                  onChange={e => setFormData({ ...formData, transportMode: e.target.value })}
                >
                  <option value="Transporte público">Transporte público / Camión</option>
                  <option value="Automóvil propio">Automóvil propio</option>
                  <option value="Motocicleta">Motocicleta</option>
                  <option value="Bicicleta / Caminando">Bicicleta / Caminando</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Disponibilidad de horarios, turnos, viajes o cambio de residencia</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Rolar turnos 12x12, sin inconveniente para viajar foráneo, residencia fija en Monterrey"
                  value={formData.scheduleAvailability}
                  onChange={e => setFormData({ ...formData, scheduleAvailability: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CAMPOS ESPECÍFICOS SEGÚN LA VACANTE */}
          <div style={{ marginBottom: '28px', background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h4 style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              color: '#0284c7', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isGuardia && <Shield size={18} style={{ color: '#0284c7' }} />}
              {isTaller && <Wrench size={18} style={{ color: '#0284c7' }} />}
              {isAlmacen && <Package size={18} style={{ color: '#0284c7' }} />}
              {isMonitorista && <Radio size={18} style={{ color: '#0284c7' }} />}
              {isOperador && <Truck size={18} style={{ color: '#0284c7' }} />}
              3. Perfil Específico para: {formData.vacancyTitle || 'Vacante Seleccionada'}
            </h4>

            {isGuardia && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Experiencia en Vigilancia Patrimonial</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Años o giros (parques, bodegas)"
                    value={formData.specificFields.surveillanceExperience || ''}
                    onChange={e => handleSpecificFieldChange('surveillanceExperience', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Control de Accesos Peatonales/Vehiculares</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Manejo de báscula, revisión de camiones"
                    value={formData.specificFields.accessControl || ''}
                    onChange={e => handleSpecificFieldChange('accessControl', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Rondines y Bastón Sensor</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Experiencia con puntos de marcación"
                    value={formData.specificFields.roundsPatrols || ''}
                    onChange={e => handleSpecificFieldChange('roundsPatrols', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Elaboración de Reportes y Bitácoras</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Habilidad de redacción de novedades"
                    value={formData.specificFields.reportsWriting || ''}
                    onChange={e => handleSpecificFieldChange('reportsWriting', e.target.value)}
                  />
                </div>
              </div>
            )}

            {isTaller && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Especialidad Mecánica</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Motores Diésel, Frenos, Suspensión, Eléctrico"
                    value={formData.specificFields.specialty || ''}
                    onChange={e => handleSpecificFieldChange('specialty', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Equipos y Marcas Atendidas</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cummins ISX, Detroit DD15, Eaton Fuller"
                    value={formData.specificFields.equipmentHandled || ''}
                    onChange={e => handleSpecificFieldChange('equipmentHandled', e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Conocimientos Técnicos y Diagnóstico por Scanner</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Uso de INSITE, DDL, multímetro y herramientas de torque"
                    value={formData.specificFields.technicalKnowledge || ''}
                    onChange={e => handleSpecificFieldChange('technicalKnowledge', e.target.value)}
                  />
                </div>
              </div>
            )}

            {isAlmacen && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Control de Inventarios y Conteos Cíclicos</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Experiencia en PEPS, Kardex, auditorías"
                    value={formData.specificFields.inventoryExperience || ''}
                    onChange={e => handleSpecificFieldChange('inventoryExperience', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Recepción de Entradas y Surtido a Taller</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Validación contra factura/orden de compra"
                    value={formData.specificFields.receivingShipping || ''}
                    onChange={e => handleSpecificFieldChange('receivingShipping', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Sistemas ERP / Software de Almacén</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Excel, SAP, sistemas propietarios"
                    value={formData.specificFields.systemsUsed || ''}
                    onChange={e => handleSpecificFieldChange('systemsUsed', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Manejo de Montacargas</label>
                  <select
                    className="form-control"
                    value={formData.specificFields.forkliftOperation || 'No'}
                    onChange={e => handleSpecificFieldChange('forkliftOperation', e.target.value)}
                  >
                    <option value="No">No maneja montacargas</option>
                    <option value="Hombre sentado (Gas/Eléctrico)">Hombre sentado (Gas/Eléctrico)</option>
                    <option value="Hombre parado (Reach)">Hombre parado (Reach)</option>
                    <option value="Ambos con constancia DC-3">Ambos con constancia DC-3</option>
                  </select>
                </div>
              </div>
            )}

            {isMonitorista && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Plataformas GPS Utilizadas</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Omnitracs, Encontrack, Webfleet, etc."
                    value={formData.specificFields.gpsPlatforms || ''}
                    onChange={e => handleSpecificFieldChange('gpsPlatforms', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Monitoreo de Flotas en Carretera</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Unidades simultáneas, paradas prohibidas"
                    value={formData.specificFields.fleetTracking || ''}
                    onChange={e => handleSpecificFieldChange('fleetTracking', e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Protocolo ante Incidentes y Paro de Motor</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Activación de botón de pánico, enlace con autoridades y aseguradora"
                    value={formData.specificFields.incidentResponse || ''}
                    onChange={e => handleSpecificFieldChange('incidentResponse', e.target.value)}
                  />
                </div>
              </div>
            )}

            {isOperador && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Tipo de Licencia Federal</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Federal Tipo B o E (Doble articulado)"
                    value={formData.specificFields.licenseType || ''}
                    onChange={e => handleSpecificFieldChange('licenseType', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Vigencia de Licencia y Apto Médico</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Vigente hasta Diciembre 2027"
                    value={formData.specificFields.licenseExpiry || ''}
                    onChange={e => handleSpecificFieldChange('licenseExpiry', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Años de Experiencia en Quinta Rueda</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 6 años en tractocamión articulado"
                    value={formData.specificFields.drivingExperience || ''}
                    onChange={e => handleSpecificFieldChange('drivingExperience', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Unidades y Transmisiones Manejadas</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Kenworth, Cascadia / Transmisión 18 vel / automatizada"
                    value={formData.specificFields.unitsOperated || ''}
                    onChange={e => handleSpecificFieldChange('unitsOperated', e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Rutas Federales Habituales</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. México - Nuevo Laredo, Monterrey - Guadalajara, Bajío"
                    value={formData.specificFields.routesCovered || ''}
                    onChange={e => handleSpecificFieldChange('routesCovered', e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isGuardia && !isTaller && !isAlmacen && !isMonitorista && !isOperador && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Ingresa notas o habilidades particulares requeridas para esta posición en la siguiente sección.
              </div>
            )}
          </div>

          {/* SECCIÓN 4: EXPERIENCIA, HISTORIAL Y PERFIL */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ 
              fontSize: '0.95rem', 
              fontWeight: 700, 
              color: '#0284c7', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              borderBottom: '1px solid var(--color-border-subtle)',
              paddingBottom: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <GraduationCap size={16} /> 4. Escolaridad, Trayectoria Laboral y Habilidades
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Nivel de Escolaridad</label>
                <select
                  className="form-control"
                  value={formData.education}
                  onChange={e => setFormData({ ...formData, education: e.target.value })}
                >
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria concluida</option>
                  <option value="Preparatoria">Preparatoria / Bachillerato</option>
                  <option value="Técnica">Carrera técnica</option>
                  <option value="Licenciatura / Ingeniería">Licenciatura / Ingeniería</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Años de Experiencia Relacionada</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-control"
                  value={formData.yearsExperience}
                  onChange={e => setFormData({ ...formData, yearsExperience: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Enlace o Referencia de CV / Documentos (Opcional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="URL en nube o nota de carpeta física"
                  value={formData.resumeUrl}
                  onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Historial de últimos empleos */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Últimos Empleos Registrados</span>
                <button
                  type="button"
                  onClick={handleAddJob}
                  className="btn btn-outline"
                  style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Agregar Empleo
                </button>
              </div>

              {formData.employmentHistory.map((job, index) => (
                <div key={index} style={{
                  background: 'var(--bg-main)',
                  padding: '14px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Empleo #{index + 1}</strong>
                    {formData.employmentHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveJob(index)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Empresa / Patrón"
                      value={job.employer}
                      onChange={e => handleJobChange(index, 'employer', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Puesto desempeñado"
                      value={job.position}
                      onChange={e => handleJobChange(index, 'position', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tiempo laborado (ej. 2 años)"
                      value={job.duration}
                      onChange={e => handleJobChange(index, 'duration', e.target.value)}
                    />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Principales actividades realizadas"
                        value={job.activities}
                        onChange={e => handleJobChange(index, 'activities', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Habilidades, Cursos y Certificaciones</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Ej. Certificación DC-3 manejo defensivo, curso primeros auxilios, conocimiento en mecánica preventiva"
                value={formData.skillsCertifications}
                onChange={e => setFormData({ ...formData, skillsCertifications: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Observaciones del Reclutador</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Apreciación de la llamada inicial, puntualidad, presentación, formalidad y razones por las que califica"
                value={formData.recruiterNotes}
                onChange={e => setFormData({ ...formData, recruiterNotes: e.target.value })}
              />
            </div>
          </div>

          {/* SECCIÓN 5: CONSENTIMIENTO Y AUTORIZACIÓN (CRÍTICO) */}
          <div style={{
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '10px'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#0284c7' }}
                checked={formData.consentShareProfile}
                onChange={e => setFormData({ ...formData, consentShareProfile: e.target.checked })}
              />
              <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                <strong style={{ color: '#0284c7' }}>Autorización del Candidato (Requisito Obligatorio):</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-main)' }}>
                  El candidato ha otorgado su consentimiento expreso para registrar sus datos laborales y compartir su perfil curricular con el comité evaluador y las áreas correspondientes de Transportes Romo para fines de este proceso de selección.
                </p>
              </div>
            </label>
          </div>

        </div>

        {/* Footer Modal con Botones */}
        <div style={{
          background: 'var(--bg-main)',
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => handleSubmit('Borrador')}
              disabled={isSubmitting}
              style={{ fontWeight: 600 }}
            >
              Guardar como Borrador
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSubmit('Pendiente de revisión')}
              disabled={isSubmitting}
              style={{
                background: '#0284c7',
                borderColor: '#0284c7',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
              }}
            >
              Guardar y Enviar a Revisión
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
