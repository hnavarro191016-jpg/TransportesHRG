import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, ArrowRight, X, CheckCircle } from 'lucide-react';

// Cargar el JSON generado por el sub-agente (Simulado aquí para la UI, en prod vendrá de DB)
import cursosContent from './cursos_hrg_contenido.json';

export const CourseViewerView = ({ courseId, setCurrentView }) => {
  const { data, activeUser } = useApp();
  
  // Find basic course info
  const courseBase = data.courses?.find(c => c.id === courseId);
  
  // Find deep content from our JSON (matching by title for demo purposes)
  const courseDeep = cursosContent.cursos.find(c => c.titulo === courseBase?.title) || cursosContent.cursos[0];

  // Flatten lessons for easy navigation
  const allLessons = courseDeep.modulos.reduce((acc, modulo, modIndex) => {
    const moduleLessons = modulo.lecciones.map((leccion, lecIndex) => ({
      ...leccion,
      moduloTitulo: modulo.titulo,
      globalIndex: acc.length + lecIndex
    }));
    return [...acc, ...moduleLessons];
  }, []);

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentLesson = allLessons[currentLessonIndex];
  const progress = Math.round(((currentLessonIndex) / allLessons.length) * 100);

  const handleNext = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleClose = () => {
    setCurrentView('mis_capacitaciones');
  };

  if (completed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="content-card" style={{ maxWidth: '500px', width: '100%', padding: '40px', textAlign: 'center' }}>
          <CheckCircle size={64} color="var(--color-success)" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>¡Lecciones Completadas!</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            Has terminado de revisar todo el material de <strong>{courseDeep.titulo}</strong>.
          </p>
          <button className="btn btn-primary" onClick={() => setCurrentView('examen')} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            Ir al Examen de Evaluación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderBottom: '1px solid var(--color-border-subtle)', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="btn-icon" onClick={handleClose}>
          <X size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {courseDeep.titulo}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <div style={{ flex: 1, background: 'var(--color-border)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ background: 'var(--color-primary)', height: '100%', width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          {currentLesson.moduloTitulo}
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 24px 0', lineHeight: 1.2 }}>
          {currentLesson.titulo}
        </h1>
        
        <div className="content-card" style={{ padding: '32px', fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--color-text-main)' }}>
          {/* Using dangerouslySetInnerHTML to allow bold tags if present, or just text */}
          <div dangerouslySetInnerHTML={{ __html: currentLesson.contenido.replace(/\n/g, '<br/>') }} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{ background: 'var(--bg-card)', padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', position: 'sticky', bottom: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="btn btn-outline" 
            onClick={handlePrev} 
            disabled={currentLessonIndex === 0}
            style={{ padding: '12px 24px', fontSize: '1rem' }}
          >
            <ArrowLeft size={20} /> Anterior
          </button>
          
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {currentLessonIndex + 1} de {allLessons.length}
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleNext}
            style={{ padding: '12px 24px', fontSize: '1rem' }}
          >
            {currentLessonIndex === allLessons.length - 1 ? 'Finalizar' : 'Siguiente'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
