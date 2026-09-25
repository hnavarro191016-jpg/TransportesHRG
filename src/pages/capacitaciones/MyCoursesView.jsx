import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, CheckCircle, Clock, AlertCircle, Award } from 'lucide-react';
import { generateCertificate } from '../../utils/certificateGenerator';

export const MyCoursesView = ({ setCurrentView, setSelectedCourse }) => {
  const { data, activeUser } = useApp();

  // In a real app, we would use the logged-in user's employee ID. 
  // For demo purposes, we will pick the first operator or use activeUser.
  // Here we'll simulate the assignments if none exist for demo purposes.
  
  const assignments = data.courseAssignments || [];
  const courses = data.courses || [];
  
  // Usamos el ID del usuario activo
  let myAssignments = activeUser 
    ? assignments.filter(a => a.userId === activeUser.id)
    : [];

  // For DEMO purposes removed so it only uses real assignments

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle size={20} color="var(--color-success)" />;
      case 'pendiente': return <Clock size={20} color="var(--color-warning)" />;
      case 'vencido': return <AlertCircle size={20} color="var(--color-danger)" />;
      default: return <BookOpen size={20} color="var(--color-text-muted)" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="badge badge-success">COMPLETADO</span>;
      case 'pendiente': return <span className="badge badge-warning">PENDIENTE</span>;
      case 'vencido': return <span className="badge badge-danger">VENCIDO</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>Mis Capacitaciones</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          {activeUser 
            ? `Cursos asignados a ${activeUser.name}`
            : 'Tu historial y cursos asignados (Modo demostración)'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {myAssignments.length > 0 ? (
          myAssignments.map(assignment => {
            const course = courses.find(c => c.id === assignment.courseId);
            if (!course) return null;

            return (
              <div key={assignment.id} className="content-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  background: 'var(--bg-main)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {getStatusIcon(assignment.status)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{course.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span>Categoría: {course.category}</span>
                    <span>•</span>
                    <span>Duración: {course.durationMinutes} min</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '8px' }}>{getStatusBadge(assignment.status)}</div>
                  {assignment.dueDate && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Vence: {assignment.dueDate}
                    </div>
                  )}
                </div>

                <button 
                  className={`btn ${assignment.status === 'completed' ? 'btn-outline' : 'btn-primary'}`}
                  onClick={async () => {
                    if (assignment.status !== 'completed') {
                      setSelectedCourse(course.id);
                      setCurrentView('ver_curso');
                    } else {
                      try {
                        const today = new Date().toLocaleDateString('es-MX');
                        await generateCertificate(
                          currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : activeUser?.name || 'Operador HRG',
                          course.title,
                          100, // mock score if completed
                          today,
                          course.validityMonths || 12
                        );
                      } catch (error) {
                        console.error('Error generating PDF:', error);
                        alert('Error al generar PDF: ' + error.message);
                      }
                    }
                  }}
                >
                  {assignment.status === 'completado' ? 'Descargar Certificado' : 'Comenzar Curso'}
                </button>
              </div>
            );
          })
        ) : (
          <div className="content-card" style={{ padding: '40px', textAlign: 'center' }}>
            <Award size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>No tienes cursos asignados</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              Cuando Recursos Humanos te asigne una capacitación, aparecerá aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
