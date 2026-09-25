import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, X, Award, AlertTriangle } from 'lucide-react';
import cursosContent from './cursos_hrg_contenido.json';
import { generateCertificate } from '../../utils/certificateGenerator';
import { supabase } from '../../lib/supabaseClient';


export const ExamViewerView = ({ courseId, setCurrentView }) => {
  const { data, setData, addToast, activeUser } = useApp();
  
  const courseBase = data.courses?.find(c => c.id === courseId);
  const courseDeep = cursosContent.cursos.find(c => c.titulo === courseBase?.title) || cursosContent.cursos[0];
  
  const minScore = courseBase?.minScoreRequired || 80;

  // Shuffle array helper
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialize randomized exam state
  const [examQuestions, setExamQuestions] = useState([]);
  
  // Run once when component mounts or courseId changes
  React.useEffect(() => {
    if (courseDeep && courseDeep.evaluacion) {
      // Get all questions, shuffle them, and pick up to 5 (or however many we want)
      const allQs = courseDeep.evaluacion;
      const shuffledQs = shuffleArray(allQs).slice(0, 5); // Pick 5 random questions
      
      // For each question, shuffle its options
      const randomizedExam = shuffledQs.map(q => ({
        ...q,
        opciones: shuffleArray(q.opciones)
      }));
      
      setExamQuestions(randomizedExam);
    }
  }, [courseDeep]);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  
  const handleSelectOption = (questionIndex, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: option
    }));
  };

  const handleNext = () => {
    if (currentQIndex < examQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleClose = () => {
    setCurrentView('mis_capacitaciones');
  };

  // Calificación
  let correctCount = 0;
  examQuestions.forEach((q, index) => {
    if (answers[index] === q.respuesta_correcta) {
      correctCount++;
    }
  });
  const scorePercentage = Math.round((correctCount / examQuestions.length) * 100);
  const passed = scorePercentage >= minScore;

  if (isFinished) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="content-card" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center' }}>
          {passed ? (
            <Award size={64} color="var(--color-success)" style={{ margin: '0 auto 20px auto' }} />
          ) : (
            <AlertTriangle size={64} color="var(--color-danger)" style={{ margin: '0 auto 20px auto' }} />
          )}
          
          <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {passed ? '¡CURSO APROBADO!' : 'CURSO NO APROBADO'}
          </h2>
          
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '32px' }}>
            Tu calificación final es: <strong>{scorePercentage}%</strong> (Mínimo requerido: {minScore}%)
          </p>
          
          {!passed && (
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', marginBottom: '32px', textAlign: 'left', borderLeft: '4px solid var(--color-danger)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-danger)' }}>Preguntas Incorrectas:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {examQuestions.map((q, i) => {
                  if (answers[i] !== q.respuesta_correcta) {
                    return <li key={i} style={{ marginBottom: '8px' }}>{q.pregunta}</li>;
                  }
                  return null;
                })}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={handleClose}>
              Volver a mis capacitaciones
            </button>
            {passed ? (
              <button className="btn btn-primary" onClick={async () => {
                try {
                  const today = new Date().toLocaleDateString('es-MX');
                  await generateCertificate(activeUser?.name || 'Operador HRG', courseBase?.title || 'Curso', scorePercentage, today, courseBase?.validityMonths || 12);
                  
                  // Update assignment to completed in db
                  const currentEmployee = data.employees.find(e => e.firstName.toLowerCase().includes(activeUser?.name?.split(' ')[0]?.toLowerCase() || 'xxx'));
                  
                  if (currentEmployee) {
                    const now = new Date().toISOString();
                    
                    if (supabase) {
                      await supabase
                        .from('romo_course_assignments')
                        .update({ status: 'completed', completion_date: now, final_score: scorePercentage })
                        .eq('course_id', courseId)
                        .eq('employee_id', currentEmployee.id);
                    }
                    
                    // Update local state
                    setData(prev => {
                      const updatedAssignments = [...(prev.courseAssignments || [])];
                      const existingIndex = updatedAssignments.findIndex(a => a.courseId === courseId && a.employeeId === currentEmployee.id);
                      
                      if (existingIndex >= 0) {
                        updatedAssignments[existingIndex] = { ...updatedAssignments[existingIndex], status: 'completed', completionDate: now, finalScore: scorePercentage };
                      }
                      return { ...prev, courseAssignments: updatedAssignments };
                    });
                  }

                  addToast('Certificado descargado correctamente', 'success');
                  handleClose();
                } catch (error) {
                  console.error('Error generating PDF:', error);
                  addToast('Error al generar PDF: ' + error.message, 'danger');
                }
              }}>
                Descargar Certificado
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => {
                setIsFinished(false);
                setCurrentQIndex(0);
                setAnswers({});
                
                // Re-shuffle for next attempt
                const allQs = courseDeep.evaluacion;
                const shuffledQs = shuffleArray(allQs).slice(0, 5);
                setExamQuestions(shuffledQs.map(q => ({
                  ...q,
                  opciones: shuffleArray(q.opciones)
                })));
              }}>
                Reintentar Examen
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (examQuestions.length === 0) return null; // loading state essentially
  const currentQ = examQuestions[currentQIndex];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderBottom: '1px solid var(--color-border-subtle)', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="btn-icon" onClick={handleClose}>
          <X size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            EVALUACIÓN FINAL: {courseDeep.titulo}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
            Pregunta {currentQIndex + 1} de {examQuestions.length}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 32px 0', lineHeight: 1.4 }}>
          {currentQ.pregunta}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentQ.opciones.map((opcion, idx) => {
            const isSelected = answers[currentQIndex] === opcion;
            return (
              <div 
                key={idx}
                onClick={() => handleSelectOption(currentQIndex, opcion)}
                className={`content-card ${isSelected ? 'selected-option' : ''}`}
                style={{ 
                  padding: '20px', 
                  cursor: 'pointer', 
                  border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                  background: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  border: isSelected ? '6px solid var(--color-primary)' : '2px solid var(--color-border)',
                  background: 'var(--bg-card)'
                }}></div>
                <div style={{ fontSize: '1.1rem', fontWeight: isSelected ? 600 : 400 }}>{opcion}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', position: 'sticky', bottom: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleNext}
            disabled={!answers[currentQIndex]}
            style={{ padding: '12px 32px', fontSize: '1rem' }}
          >
            {currentQIndex === examQuestions.length - 1 ? 'Calificar Examen' : 'Siguiente Pregunta'}
          </button>
        </div>
      </div>
    </div>
  );
};
