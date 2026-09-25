import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, UserPlus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const AdminCoursesView = () => {
  const { addToast, fetchFromSupabase } = useApp();
  
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, usersRes, assignmentsRes] = await Promise.all([
        supabase.from('romo_courses').select('*').order('created_at', { ascending: false }),
        supabase.from('romo_users').select('*').order('created_at', { ascending: false }),
        supabase.from('romo_course_assignments').select('*').order('created_at', { ascending: false })
      ]);

      if (coursesRes.error && coursesRes.error.code !== '42P01') {
        console.error('Error fetching courses:', coursesRes.error);
      }
      if (usersRes.error && usersRes.error.code !== '42P01') {
        console.error('Error fetching users:', usersRes.error);
      }
      if (assignmentsRes.error && assignmentsRes.error.code !== '42P01') {
        console.error('Error fetching assignments:', assignmentsRes.error);
      }

      setCourses(coursesRes.data || []);
      setUsers(usersRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Error al cargar datos de Supabase', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase.from('romo_course_assignments').select('*').order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleOpenAssignModal = (course) => {
    setSelectedCourseForAssign(course);
    setSelectedUserId('');
    setShowAssignModal(true);
  };

  const handleAssignCourse = async () => {
    if (!selectedUserId || !selectedCourseForAssign) {
      addToast('Por favor, selecciona un empleado', 'warning');
      return;
    }

    setAssigning(true);
    try {
      const { error } = await supabase
        .from('romo_course_assignments')
        .insert({
          user_id: selectedUserId,
          course_id: selectedCourseForAssign.id,
          status: 'assigned'
        });

      if (error) throw error;

      addToast('Curso asignado correctamente', 'success');
      setShowAssignModal(false);
      fetchAssignments();
      if (fetchFromSupabase) fetchFromSupabase();
    } catch (error) {
      console.error('Error assigning course:', error);
      addToast('Error al asignar el curso', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('¿Estás seguro de que deseas desasignar este curso?')) return;
    
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('romo_course_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      addToast('Asignación removida correctamente', 'success');
      fetchAssignments();
      if (fetchFromSupabase) fetchFromSupabase();
    } catch (error) {
      console.error('Error removing assignment:', error);
      addToast('Error al remover la asignación', 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Administración de Cursos</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => addToast('Funcionalidad en desarrollo', 'info')}
          >
            <Plus size={20} />
            Nuevo Curso
          </button>
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Cargando cursos...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título del Curso</th>
                  <th>Categoría</th>
                  <th>Perfil</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courses.length > 0 ? (
                  courses.map(course => (
                    <tr key={course.id}>
                      <td style={{ fontWeight: 600 }}>{course.title || course.titulo || 'Sin título'}</td>
                      <td>{course.category || course.categoria || 'N/A'}</td>
                      <td>{course.profile || course.perfil || 'N/A'}</td>
                      <td>{course.duration_minutes || course.duracion_minutos || course.durationMinutes || '30'} min</td>
                      <td>
                        <span className={`badge ${course.status === 'publicado' ? 'badge-success' : 'badge-warning'}`}>
                          {(course.status || 'borrador').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--color-primary)' }} 
                            title="Asignar a Empleado"
                            onClick={() => handleOpenAssignModal(course)}
                          >
                            <UserPlus size={18} />
                          </button>
                          <button className="btn-icon" title="Editar Información">
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No hay cursos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Asignaciones Actuales</h2>
      </div>

      <div className="content-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Cargando asignaciones...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Curso</th>
                  <th>Estado</th>
                  <th>Fecha de Asignación</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? (
                  assignments.map(assignment => {
                    const user = users.find(u => u.id === assignment.user_id);
                    const course = courses.find(c => c.id === assignment.course_id);
                    const userName = user ? (user.full_name || user.nombre || user.email || user.id) : assignment.user_id;
                    const courseName = course ? (course.title || course.titulo || 'Sin título') : assignment.course_id;
                    
                    return (
                      <tr key={assignment.id}>
                        <td style={{ fontWeight: 600 }}>{userName}</td>
                        <td>{courseName}</td>
                        <td>
                          <span className="badge badge-info">
                            {(assignment.status || 'assigned').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              className="btn-icon" 
                              style={{ color: 'var(--color-danger, #dc2626)' }} 
                              title="Desasignar Curso"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                              disabled={removing}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No hay asignaciones registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              Asignar Curso
            </h3>
            <p style={{ marginBottom: '16px' }}>
              <strong>Curso:</strong> {selectedCourseForAssign?.title || selectedCourseForAssign?.titulo}
            </p>
            
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Seleccionar Empleado</label>
              <select 
                className="form-control" 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Selecciona un usuario --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.nombre || user.email || user.id}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAssignCourse}
                disabled={assigning || !selectedUserId}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {assigning ? 'Asignando...' : <><Check size={18} /> Asignar Curso</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
