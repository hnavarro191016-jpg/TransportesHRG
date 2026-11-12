import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RecruitmentDashboardView } from './RecruitmentDashboardView';
import { CandidatesListView } from './CandidatesListView';
import { CandidateDetailView } from './CandidateDetailView';
import { MyPendingView } from './MyPendingView';
import { VacanciesView } from './VacanciesView';
import { CandidateFormModal } from './CandidateFormModal';

export const RecruitmentView = ({ currentSubView = 'dashboard', setCurrentSubView = null, openModalExternal = false, setOpenModalExternal = null }) => {
  const { data, fetchFromSupabase, setData } = useApp();

  const [internalView, setInternalView] = useState('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState(null);

  // Sincronizar con Supabase al abrir el módulo
  useEffect(() => {
    if (fetchFromSupabase) fetchFromSupabase();
  }, []);

  // Purgar inmediatamente cualquier candidato demo residual
  useEffect(() => {
    if (data?.recruitmentCandidates && data.recruitmentCandidates.some(c => c.id === 'cand-001' || c.id === 'cand-002')) {
      setData(prev => ({
        ...prev,
        recruitmentCandidates: [],
        recruitmentFollowups: [],
        recruitmentHistory: [],
        recruitmentNotifications: [],
        recruitmentVacancies: (prev.recruitmentVacancies || []).filter(v => v.id === 'vac-guardia-01' || v.title === 'Guardia de Seguridad')
      }));
    }
  }, [data?.recruitmentCandidates]);

  const activeView = currentSubView || internalView;
  const setView = setCurrentSubView || setInternalView;

  const handleOpenNewCandidate = () => {
    setCandidateToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditCandidate = (cand) => {
    setCandidateToEdit(cand);
    setIsFormModalOpen(true);
  };

  const handleSelectCandidate = (candId) => {
    setSelectedCandidateId(candId);
    setView('expediente');
  };

  return (
    <div style={{ width: '100%', minHeight: '80vh' }}>
      
      {activeView === 'dashboard' && (
        <RecruitmentDashboardView
          setCurrentView={setView}
          setSelectedCandidateId={setSelectedCandidateId}
          openNewCandidateModal={handleOpenNewCandidate}
        />
      )}

      {activeView === 'candidatos' && (
        <CandidatesListView
          onSelectCandidate={handleSelectCandidate}
          onNewCandidate={handleOpenNewCandidate}
        />
      )}

      {activeView === 'expediente' && (
        <CandidateDetailView
          candidateId={selectedCandidateId}
          onBack={() => setView('candidatos')}
          onEdit={handleOpenEditCandidate}
        />
      )}

      {activeView === 'pendientes' && (
        <MyPendingView
          onSelectCandidate={handleSelectCandidate}
        />
      )}

      {activeView === 'vacantes' && (
        <VacanciesView />
      )}

      {/* Modal de Registro / Edición de Candidato */}
      <CandidateFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        candidateToEdit={candidateToEdit}
        onSaved={() => {
          setIsFormModalOpen(false);
        }}
      />
    </div>
  );
};
