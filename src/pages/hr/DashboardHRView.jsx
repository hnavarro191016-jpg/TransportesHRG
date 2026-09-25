import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, FileText, AlertTriangle, Clock, LogIn, CalendarCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const DashboardHRView = ({ setCurrentView }) => {
  const { data, activeUser } = useApp();
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: attData, error } = await supabase
        .from('romo_attendance')
        .select('*')
        .gte('check_in', today.toISOString())
        .order('check_in', { ascending: false });

      if (!error && attData) {
        // Unir con nombres de empleados
        const { data: usersData } = await supabase.from('romo_users').select('id, name');
        const merged = attData.map(att => {
          const user = usersData?.find(u => u.id === att.user_id);
          return { ...att, name: user?.name || 'Desconocido' };
        });
        setTodayAttendance(merged);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeCount = data.employees?.filter(e => e.status === 'activo').length || 0;
  const onTimeCount = todayAttendance.filter(a => a.status === 'puntual').length;
  const lateCount = todayAttendance.filter(a => a.status === 'retardo').length;

  return (
    <div className="fade-in" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', color: 'var(--color-text-main)' }}>Dashboard RRHH</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#e0e7ff', padding: '16px', borderRadius: '12px', color: '#4338ca' }}>
            <Users size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Plantilla Activa</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{activeCount}</p>
          </div>
        </div>

        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => setCurrentView('asistencias')}>
          <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '12px', color: '#15803d' }}>
            <CalendarCheck size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Puntuales Hoy</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{onTimeCount}</p>
          </div>
        </div>

        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => setCurrentView('asistencias')}>
          <div style={{ background: '#fef08a', padding: '16px', borderRadius: '12px', color: '#a16207' }}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Retardos Hoy</h3>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{lateCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Entradas Recientes */}
        <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Últimas Entradas y Salidas</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setCurrentView('asistencias')}>Ver Todo</button>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Cargando...</td></tr>
                ) : todayAttendance.length > 0 ? (
                  todayAttendance.slice(0, 5).map(att => (
                    <tr key={att.id}>
                      <td style={{ fontWeight: 600 }}>{att.name}</td>
                      <td>{formatTime(att.check_in)}</td>
                      <td>{formatTime(att.check_out)}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: att.status === 'puntual' ? '#dcfce7' : '#fef08a', color: att.status === 'puntual' ? '#166534' : '#854d0e' }}>
                          {att.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>Nadie ha checado entrada hoy.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="content-card">
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Acciones Rápidas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onClick={() => setCurrentView('empleados')}>
              <FileText size={18} /> Directorio de Empleados
            </button>
            <button className="btn btn-outline" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} onClick={() => setCurrentView('asistencias')}>
              <CalendarCheck size={18} /> Reporte Completo de Asistencias
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
