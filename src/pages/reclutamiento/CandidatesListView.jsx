import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, Search, Filter, Plus, Calendar, Clock, 
  ChevronRight, Phone, Briefcase, Eye, AlertCircle 
} from 'lucide-react';

export const CandidatesListView = ({ onSelectCandidate, onNewCandidate }) => {
  const { data } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRecruiter, setSelectedRecruiter] = useState('all');

  const candidates = data.recruitmentCandidates || [];
  const vacancies = data.recruitmentVacancies || [];

  // Lista de reclutadores únicos
  const recruiters = useMemo(() => {
    const set = new Set();
    candidates.forEach(c => {
      if (c.assignedRecruiter) set.add(c.assignedRecruiter);
    });
    return Array.from(set);
  }, [candidates]);

  // Filtrado
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      // Búsqueda por texto (nombre, teléfono, folio, email)
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        cand.fullName?.toLowerCase().includes(term) ||
        cand.phone?.includes(term) ||
        cand.folio?.toLowerCase().includes(term) ||
        cand.email?.toLowerCase().includes(term);

      // Filtro vacante
      const matchVacancy = selectedVacancy === 'all' || cand.vacancyId === selectedVacancy || cand.vacancyTitle === selectedVacancy;

      // Filtro estado
      const matchStatus = selectedStatus === 'all' || cand.status === selectedStatus;

      // Filtro reclutador
      const matchRecruiter = selectedRecruiter === 'all' || cand.assignedRecruiter === selectedRecruiter;

      return matchSearch && matchVacancy && matchStatus && matchRecruiter;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [candidates, searchTerm, selectedVacancy, selectedStatus, selectedRecruiter]);

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header del Listado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={26} style={{ color: '#0284c7' }} />
            Candidatos Registrados
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Listado completo de aspirantes, seguimiento de estado y expedientes.
          </p>
        </div>

        <button
          onClick={onNewCandidate}
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
          <Plus size={18} /> Registrar Candidato
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div style={{
        background: 'var(--bg-surface)',
        padding: '16px 20px',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Buscador de texto */}
        <div style={{ position: 'relative', gridColumn: 'span 2' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, teléfono o folio..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Filtro por Vacante */}
        <div>
          <select
            className="form-control"
            value={selectedVacancy}
            onChange={e => setSelectedVacancy(e.target.value)}
          >
            <option value="all">Todas las Vacantes</option>
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <select
            className="form-control"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="Borrador">Borrador</option>
            <option value="Pendiente de revisión">Pendiente de revisión</option>
            <option value="Información adicional solicitada">Información adicional solicitada</option>
            <option value="Seguimiento solicitado">Seguimiento solicitado</option>
            <option value="Entrevista solicitada">Entrevista solicitada</option>
            <option value="Entrevista programada">Entrevista programada</option>
            <option value="En evaluación">En evaluación</option>
            <option value="Contratado">Contratado</option>
            <option value="Descartado">Descartado</option>
            <option value="Candidato desistió">Candidato desistió</option>
          </select>
        </div>

        {/* Filtro por Responsable */}
        {recruiters.length > 0 && (
          <div>
            <select
              className="form-control"
              value={selectedRecruiter}
              onChange={e => setSelectedRecruiter(e.target.value)}
            >
              <option value="all">Todos los Responsables</option>
              {recruiters.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabla de Candidatos */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Candidato / Folio</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Vacante</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Fecha Registro</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Estado</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Próxima Acción</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Responsable</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map(cand => {
                  const badge = getStatusBadge(cand.status);
                  return (
                    <tr 
                      key={cand.id} 
                      onClick={() => onSelectCandidate(cand.id)}
                      style={{ 
                        borderBottom: '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{cand.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {cand.folio} • {cand.phone}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontWeight: 600, color: '#0284c7' }}>{cand.vacancyTitle}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {cand.city}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                        {new Date(cand.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          display: 'inline-block'
                        }}>
                          {cand.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: '220px' }}>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--color-text-main)',
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {cand.nextAction || 'Sin acción programada'}
                        </div>
                        {cand.nextActionDate && (
                          <div style={{ fontSize: '0.72rem', color: '#d97706' }}>
                            Vence: {new Date(cand.nextActionDate).toLocaleDateString('es-MX')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                        {cand.assignedRecruiter || 'No asignado'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(cand.id);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Expediente
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No se encontraron candidatos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
