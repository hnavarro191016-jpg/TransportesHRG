import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';
import { Clock, LogIn, LogOut } from 'lucide-react';

export const CheckInWidget = () => {
  const { activeUser, addToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  
  useEffect(() => {
    if (!activeUser || !supabase) return;
    
    const checkStatus = async () => {
      setLoading(true);
      try {
        // Buscar el último registro de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await supabase
          .from('romo_attendance')
          .select('*')
          .eq('user_id', activeUser.id)
          .gte('check_in', today.toISOString())
          .order('check_in', { ascending: false })
          .limit(1)
          .single();
          
        if (data && !error) {
          setCurrentAttendance(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
  }, [activeUser]);

  const handleCheckInOut = async () => {
    if (!activeUser || !supabase) return;
    setLoading(true);
    
    try {
      if (currentAttendance && !currentAttendance.check_out) {
        // Hacer Check-Out
        const { error } = await supabase
          .from('romo_attendance')
          .update({ check_out: new Date().toISOString() })
          .eq('id', currentAttendance.id);
          
        if (!error) {
          setCurrentAttendance({ ...currentAttendance, check_out: new Date().toISOString() });
          addToast('Salida registrada con éxito', 'success');
        } else {
          addToast('Error al registrar salida', 'error');
        }
      } else {
        // Hacer Check-In con GPS para operadores y dinámico para el resto
        let shiftStartTime = '09:00:00';
        
        // Buscar el perfil de RH del empleado para ver su turno
        const { data: profile } = await supabase
          .from('romo_hr_profiles')
          .select('shift_start_time')
          .eq('user_id', activeUser.id)
          .single();
          
        if (profile && profile.shift_start_time) {
          shiftStartTime = profile.shift_start_time;
        }

        // Determinar status (retardo si pasa de sus 15 minutos de tolerancia)
        const now = new Date();
        const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);
        const shiftTimeInMinutes = (shiftHour * 60) + shiftMinute;
        const nowInMinutes = (now.getHours() * 60) + now.getMinutes();
        
        let status = 'puntual';
        if (nowInMinutes > shiftTimeInMinutes + 15) {
            status = 'retardo';
        }

        // --- GPS Capture ---
        let location = null;
        if ('geolocation' in navigator) {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            location = `${pos.coords.latitude},${pos.coords.longitude}`;
          } catch (geoErr) {
            console.warn("No se pudo obtener GPS:", geoErr);
            // Seguimos adelante aunque no den permiso, o podrías forzarlo devolviendo un error.
          }
        }

        const { data, error } = await supabase
          .from('romo_attendance')
          .insert([{
            user_id: activeUser.id,
            status: status,
            notes: location ? `GPS: ${location}` : 'Sin GPS'
          }])
          .select();
          
        if (!error && data && data.length > 0) {
          setCurrentAttendance(data[0]);
          addToast(location ? `Entrada con GPS: ${status}` : `Entrada registrada: ${status}`, 'success');
        } else {
          addToast(`Error: ${error?.message || 'Desconocido'}`, 'error');
          console.error("Insert error:", error);
        }
      }
    } catch (err) {
      addToast(`Error de conexión: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!activeUser) return null;

  // Extraer el objeto correctamente si por alguna razón es un array
  const attRecord = Array.isArray(currentAttendance) ? currentAttendance[0] : currentAttendance;
  
  const isCheckedIn = attRecord && !attRecord.check_out;
  const isFinished = attRecord && attRecord.check_out;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
      <button
        onClick={handleCheckInOut}
        disabled={loading || isFinished}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: (loading || isFinished) ? 'not-allowed' : 'pointer',
          backgroundColor: isFinished ? 'var(--bg-card-hover)' : isCheckedIn ? '#fee2e2' : '#dcfce7',
          color: isFinished ? 'var(--color-text-muted)' : isCheckedIn ? '#991b1b' : '#166534',
          transition: 'all 0.2s ease'
        }}
        title={isFinished ? "Turno completado por hoy" : "Registrar Asistencia"}
      >
        {loading ? (
          <div className="spinner" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : isFinished ? (
          <><Clock size={16} /> Turno Finalizado</>
        ) : isCheckedIn ? (
          <><LogOut size={16} /> Checar Salida</>
        ) : (
          <><LogIn size={16} /> Checar Entrada</>
        )}
      </button>
    </div>
  );
};
