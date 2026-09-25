import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AlertTriangle, Clock } from 'lucide-react';

export const AlertasView = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase.from('romo_users').select('id, name');
      const { data: profilesData } = await supabase.from('romo_hr_profiles').select('user_id, license_expiry, medical_exam_expiry');
      
      if (usersData && profilesData) {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30); // 30 days ahead for "próximos a vencer"

        const upcomingAlerts = [];

        usersData.forEach(user => {
          const profile = profilesData.find(p => p.user_id === user.id) || {};
          
          if (profile.license_expiry) {
            const expDate = new Date(profile.license_expiry);
            if (expDate <= nextMonth) {
              upcomingAlerts.push({
                id: `${user.id}-lic`,
                name: user.name || 'Sin nombre',
                type: 'Licencia',
                date: profile.license_expiry,
                isExpired: expDate < today
              });
            }
          }

          if (profile.medical_exam_expiry) {
            const expDate = new Date(profile.medical_exam_expiry);
            if (expDate <= nextMonth) {
              upcomingAlerts.push({
                id: `${user.id}-med`,
                name: user.name || 'Sin nombre',
                type: 'Examen Médico',
                date: profile.medical_exam_expiry,
                isExpired: expDate < today
              });
            }
          }
        });

        // Sort by date ascending
        upcomingAlerts.sort((a, b) => new Date(a.date) - new Date(b.date));
        setAlerts(upcomingAlerts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Alertas de Vencimiento</h2>
      </div>

      <div className="content-card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Tipo de Documento</th>
                <th>Fecha de Vencimiento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Calculando alertas...</td></tr>
              ) : alerts.length > 0 ? (
                alerts.map(alert => (
                  <tr key={alert.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{alert.name}</div>
                    </td>
                    <td>{alert.type}</td>
                    <td>{new Date(alert.date).toLocaleDateString()}</td>
                    <td>
                      {alert.isExpired ? (
                        <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                          <AlertTriangle size={16} /> Vencido
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-warning)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                          <Clock size={16} /> Próximo a vencer
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No hay documentos vencidos o próximos a vencer</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
