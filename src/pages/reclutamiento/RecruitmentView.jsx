import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RecruitmentDashboardView } from './RecruitmentDashboardView';
import { CandidatesListView } from './CandidatesListView';
import { CandidateDetailView } from './CandidateDetailView';
import { MyPendingView } from './MyPendingView';
import { VacanciesView } from './VacanciesView';
import { CandidateFormModal } from './CandidateFormModal';

export const RecruitmentView = ({ currentSubView = 'dashboard', setCurrentSubView = null, openModalExternal = false, setOpenModalExternal = null }) => {
  const { data } = useApp();

  const [internalView, setInternalView] = useState('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState(null);

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
