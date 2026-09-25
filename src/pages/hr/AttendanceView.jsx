import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';
import { Users, Clock, Calendar, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';

export const AttendanceView = () => {
  const { addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      if (!supabase) return;
      
      // Obtener asistencias y hacer join con usuarios para los nombres
      const { data, error } = await supabase
        .from('romo_attendance')
        .select(`
          id,
          check_in,
          check_out,
          status,
          user_id,
          notes
        `)
        .order('check_in', { ascending: false });

      if (error) throw error;

      // Obtener perfiles de usuarios localmente porque no establecimos foreign keys estrictas
      const { data: usersData, error: usersError } = await supabase
        .from('romo_users')
        .select('id, name, email, role');
        
      if (usersError) throw usersError;

      // Unir la data en JS
      const merged = data.map(att => {
        const user = usersData.find(u => u.id === att.user_id) || { name: 'Usuario Desconocido', role: '-' };
        return { ...att, ...user };
      });

      setAttendanceData(merged);
    } catch (error) {
      console.error(error);
      addToast('Error al cargar reporte de asistencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'puntual':
        return <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}><CheckCircle2 size={12} style={{marginRight:4}}/> Puntual</span>;
      case 'retardo':
        return <span className="badge" style={{ backgroundColor: '#fef08a', color: '#854d0e' }}><AlertTriangle size={12} style={{marginRight:4}}/> Retardo</span>;
      case 'falta':
      default:
        return <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}><XCircle size={12} style={{marginRight:4}}/> Falta</span>;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '--/--/----';
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const filtered = attendanceData.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Stats
  const todayStr = new Date().toLocaleDateString();
  const todayRecords = attendanceData.filter(a => formatDate(a.check_in) === todayStr);
  const onTimeCount = todayRecords.filter(a => a.status === 'puntual').length;
  const lateCount = todayRecords.filter(a => a.status === 'retardo').length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Reporte de Asistencias</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Registro general del personal</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '12px', color: '#4338ca' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Registros Hoy</p>
            <h3 style={{ margin: 0 }}>{todayRecords.length}</h3>
          </div>
        </div>
        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '12px', color: '#15803d' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Puntuales Hoy</p>
            <h3 style={{ margin: 0 }}>{onTimeCount}</h3>
          </div>
        </div>
        <div className="content-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#fef08a', padding: '12px', borderRadius: '12px', color: '#a16207' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Retardos Hoy</p>
            <h3 style={{ margin: 0 }}>{lateCount}</h3>
          </div>
        </div>
      </div>

      <div className="content-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando registros...</div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table" style={{ width: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Fecha</th>
                  <th style={{ width: '30%' }}>Empleado</th>
                  <th style={{ width: '15%' }}>Rol</th>
                  <th style={{ width: '15%' }}>Entrada</th>
                  <th style={{ width: '15%' }}>Salida</th>
                  <th style={{ width: '10%' }}>Estatus</th>
                  <th style={{ width: '15%' }}>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((record) => (
                  <tr key={record.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle', color:'var(--color-text-muted)' }}/> {formatDate(record.check_in)}</td>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td>{record.role}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle', color:'#16a34a' }}/> {formatTime(record.check_in)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle', color:'#dc2626' }}/> {formatTime(record.check_out)}</td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {record.notes?.includes('GPS:') ? (
                        <a href={`https://www.google.com/maps?q=${record.notes.replace('GPS: ', '')}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                          Ver Mapa
                        </a>
                      ) : (
                        record.notes || '-'
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                      No se encontraron registros de asistencia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
