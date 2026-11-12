import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Briefcase, Plus, Edit2, PauseCircle, PlayCircle, 
  XCircle, MapPin, Clock, Users, X, CheckCircle 
} from 'lucide-react';

export const VacanciesView = () => {
  const { data, addRecruitmentVacancy, updateRecruitmentVacancy, addToast } = useApp();

  const vacancies = data.recruitmentVacancies || [];
  const candidates = data.recruitmentCandidates || [];

  const [showModal, setShowModal] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    department: 'Operaciones y Logística',
    location: 'Base Romo - Patio Matriz',
    description: '',
    requirements: '',
    scheduleShift: '',
    slots: 1,
    status: 'abierta'
  });

  const handleOpenCreate = () => {
    setEditingVacancy(null);
    setFormData({
      title: '',
      department: 'Operaciones y Transporte',
      location: 'Base Romo - Patio Matriz',
      description: '',
      requirements: '',
      scheduleShift: 'Turno completo',
      slots: 1,
      status: 'abierta'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (vac) => {
    setEditingVacancy(vac);
    setFormData({
      title: vac.title,
      department: vac.department,
      location: vac.location,
      description: vac.description,
      requirements: vac.requirements,
      scheduleShift: vac.scheduleShift,
      slots: vac.slots,
      status: vac.status
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (vac) => {
    let newStatus = 'abierta';
    if (vac.status === 'abierta') newStatus = 'pausada';
    else if (vac.status === 'pausada') newStatus = 'cerrada';
    else if (vac.status === 'cerrada') newStatus = 'abierta';

    await updateRecruitmentVacancy(vac.id, { status: newStatus });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('El nombre de la vacante es obligatorio', 'warning');
      return;
    }

    try {
      if (editingVacancy) {
        await updateRecruitmentVacancy(editingVacancy.id, formData);
      } else {
        await addRecruitmentVacancy(formData);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      addToast('Error al guardar vacante', 'danger');
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'abierta': return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
      case 'pausada': return { bg: '#fef3c7', color: '#92400e', border: '#fde047' };
      case 'cerrada': return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={26} style={{ color: '#0284c7' }} />
            Catálogo de Vacantes
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Administración de plazas activas, requisitos de contratación y estado de vacantes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary"
          style={{
            background: '#0284c7',
            borderColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
          }}
        >
          <Plus size={18} /> Nueva Vacante
        </button>
      </div>

      {/* Grid de Vacantes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {vacancies.map(vac => {
          const appliedCount = candidates.filter(c => c.vacancyId === vac.id || c.vacancyTitle === vac.title).length;
          const hiredCount = candidates.filter(c => (c.vacancyId === vac.id || c.vacancyTitle === vac.title) && c.status === 'Contratado').length;
          const statusStyle = getStatusColor(vac.status);

          return (
            <div key={vac.id} style={{
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                    {vac.department}
                  </span>
                  <span style={{
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`
                  }}>
                    {vac.status}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                  {vac.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  <MapPin size={14} /> {vac.location}
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', lineHeight: '1.4', marginBottom: '12px' }}>
                  {vac.description}
                </p>

                {vac.requirements && (
                  <div style={{ background: 'var(--bg-main)', padding: '10px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '14px' }}>
                    <strong style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Requisitos clave:</strong>
                    {vac.requirements}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <Clock size={14} /> {vac.scheduleShift}
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Plazas: </span>
                  <strong>{hiredCount}/{vac.slots} cubiertas</strong>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px' }}>
                    {appliedCount} postulados totales
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleStatus(vac)}
                    className="btn btn-outline"
                    title={`Cambiar estatus (Actual: ${vac.status})`}
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  >
                    {vac.status === 'abierta' ? 'Pausar' : vac.status === 'pausada' ? 'Cerrar' : 'Reabrir'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(vac)}
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Vacante */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingVacancy ? 'Editar Vacante' : 'Crear Nueva Vacante'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Puesto / Nombre de la Vacante *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej. Operador de Patio / Maniobras"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Área o Departamento</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Operaciones / Mantenimiento"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Ubicación</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Base Romo - Patio Matriz"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Descripción del Puesto</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Responsabilidades y objetivo de la posición..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Requisitos y Perfil Deseado</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Años de experiencia, licencias, certificaciones..."
                  value={formData.requirements}
                  onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Horario o Turno</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Turnos rotativos 12x12"
                    value={formData.scheduleShift}
                    onChange={e => setFormData({ ...formData, scheduleShift: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Número de Plazas</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.slots}
                    onChange={e => setFormData({ ...formData, slots: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Estado</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="abierta">Abierta</option>
                    <option value="pausada">Pausada</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  {editingVacancy ? 'Guardar Cambios' : 'Crear Vacante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
