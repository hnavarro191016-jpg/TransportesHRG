import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, LogIn, LogOut, Search, X, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react';

export const KioskView = ({ setActiveModule }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [nip, setNip] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { text, type }
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmps = async () => {
      const { data } = await supabase.from('romo_users').select('id, name, role').eq('active', true);
      if (data) {
        // Excluir choferes si queremos, pero de momento los cargamos todos o filtramos por rol.
        // Opcional: const base = data.filter(e => e.role !== 'Operador');
        setEmployees(data.filter(e => e.role !== 'Operador')); 
      }
    };
    fetchEmps();
  }, []);

  const handleNipInput = (digit) => {
    if (nip.length < 4) setNip(nip + digit);
  };
  
  const handleClearNip = () => setNip('');

  const handleAction = async (actionType) => {
    if (nip.length !== 4) return;
    setLoading(true);
    setMessage(null);

    try {
      // 1. Validar NIP
      const { data: profileData, error: profileError } = await supabase
        .from('romo_hr_profiles')
        .select('nip')
        .eq('user_id', selectedEmp.id)
        .single();

      // Si no hay perfil aún, su NIP por defecto es 1234
      let expectedNip = '1234';
      if (profileData && profileData.nip) {
        expectedNip = profileData.nip;
      }

      if (nip !== expectedNip) {
        setMessage({ text: 'NIP Incorrecto', type: 'error' });
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar si ya tiene entrada hoy
      const { data: attToday } = await supabase
        .from('romo_attendance')
        .select('*')
        .eq('user_id', selectedEmp.id)
        .gte('check_in', today.toISOString())
        .order('check_in', { ascending: false })
        .limit(1)
        .single();

      if (actionType === 'entrada') {
        if (attToday && !attToday.check_out) {
          setMessage({ text: 'Ya tienes un turno activo. Debes registrar salida.', type: 'error' });
          setLoading(false);
          return;
        }

        // Determinar status dinmico
        let shiftStartTime = '09:00:00';
        const { data: profile } = await supabase
          .from('romo_hr_profiles')
          .select('shift_start_time')
          .eq('user_id', selectedEmp.id)
          .single();
          
        if (profile?.shift_start_time) shiftStartTime = profile.shift_start_time;

        const now = new Date();
        const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);
        const shiftTimeInMinutes = (shiftHour * 60) + shiftMinute;
        const nowInMinutes = (now.getHours() * 60) + now.getMinutes();
        
        let status = 'puntual';
        if (nowInMinutes > shiftTimeInMinutes + 15) status = 'retardo';

        const { error } = await supabase
          .from('romo_attendance')
          .insert([{ user_id: selectedEmp.id, status }]);

        if (!error) {
          setMessage({ text: `Entrada registrada: ${status.toUpperCase()}`, type: 'success' });
          setTimeout(() => { setSelectedEmp(null); setNip(''); setMessage(null); }, 3000);
        } else {
          setMessage({ text: 'Error al registrar entrada', type: 'error' });
        }

      } else {
        // Salida
        if (!attToday || attToday.check_out) {
          setMessage({ text: 'No tienes un turno activo para cerrar hoy.', type: 'error' });
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('romo_attendance')
          .update({ check_out: new Date().toISOString() })
          .eq('id', attToday.id);

        if (!error) {
          setMessage({ text: 'Salida registrada con xito. Buen descanso!', type: 'success' });
          setTimeout(() => { setSelectedEmp(null); setNip(''); setMessage(null); }, 3000);
        } else {
          setMessage({ text: 'Error al registrar salida', type: 'error' });
        }
      }
    } catch (err) {
      setMessage({ text: 'Error de red', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  // Exit button logic for admins (hidden bottom left)
  const [clickCount, setClickCount] = useState(0);
  const handleHiddenExit = () => {
    if (clickCount >= 4) {
      setActiveModule(null);
    } else {
      setClickCount(c => c + 1);
      setTimeout(() => setClickCount(0), 3000);
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', background: '#020617' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src="/logo.jpg" alt="Logo" style={{ height: '50px', borderRadius: '8px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Modo Kiosco</h1>
            <p style={{ margin: 0, color: '#94a3b8' }}>Checador Digital HRG</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
            {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: Employee Selection */}
        <div style={{ width: '400px', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
          <div style={{ padding: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '16px', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Buscar mi nombre..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', fontSize: '1.1rem', borderRadius: '12px', border: '1px solid #334155', background: '#1e293b', color: 'white', outline: 'none' }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(emp => (
              <button 
                key={emp.id}
                onClick={() => { setSelectedEmp(emp); setNip(''); setMessage(null); }}
                style={{ 
                  padding: '20px', 
                  background: selectedEmp?.id === emp.id ? '#3b82f6' : '#1e293b', 
                  border: 'none', 
                  borderRadius: '12px', 
                  textAlign: 'left', 
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{emp.name}</div>
                <div style={{ color: selectedEmp?.id === emp.id ? '#bfdbfe' : '#94a3b8' }}>{emp.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: NIP & Action */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', padding: '40px' }}>
          {!selectedEmp ? (
            <div style={{ textAlign: 'center', color: '#475569' }}>
              <Fingerprint size={120} style={{ margin: '0 auto 24px auto', opacity: 0.5 }} />
              <h2 style={{ fontSize: '2rem' }}>Selecciona tu nombre en la lista</h2>
              <p style={{ fontSize: '1.2rem' }}>para registrar tu entrada o salida</p>
            </div>
          ) : (
            <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>{selectedEmp.name}</h2>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>Ingresa tu NIP para confirmar</p>
              </div>

              {message ? (
                <div style={{ 
                  padding: '24px', 
                  background: message.type === 'success' ? '#064e3b' : '#7f1d1d', 
                  color: message.type === 'success' ? '#34d399' : '#fca5a5',
                  borderRadius: '16px',
                  textAlign: 'center',
                  width: '100%',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  {message.type === 'success' ? <CheckCircle2 size={48} /> : <AlertTriangle size={48} />}
                  {message.text}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ 
                        width: '24px', height: '24px', borderRadius: '50%', 
                        background: nip.length > i ? '#3b82f6' : '#1e293b',
                        transition: 'background 0.2s'
                      }} />
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%', marginBottom: '40px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button 
                        key={num} onClick={() => handleNipInput(num.toString())}
                        style={{ padding: '24px 0', fontSize: '2rem', background: '#1e293b', border: 'none', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                      >{num}</button>
                    ))}
                    <button onClick={handleClearNip} style={{ padding: '24px 0', fontSize: '1.5rem', background: '#334155', border: 'none', borderRadius: '16px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={32} />
                    </button>
                    <button onClick={() => handleNipInput('0')} style={{ padding: '24px 0', fontSize: '2rem', background: '#1e293b', border: 'none', borderRadius: '16px', color: 'white', cursor: 'pointer', fontWeight: 700 }}>0</button>
                    <div />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                    <button 
                      onClick={() => handleAction('entrada')}
                      disabled={nip.length !== 4 || loading}
                      style={{ flex: 1, padding: '20px', fontSize: '1.2rem', background: '#16a34a', border: 'none', borderRadius: '16px', color: 'white', cursor: nip.length === 4 ? 'pointer' : 'not-allowed', opacity: nip.length === 4 ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}
                    >
                      <LogIn size={24} /> ENTRADA
                    </button>
                    <button 
                      onClick={() => handleAction('salida')}
                      disabled={nip.length !== 4 || loading}
                      style={{ flex: 1, padding: '20px', fontSize: '1.2rem', background: '#dc2626', border: 'none', borderRadius: '16px', color: 'white', cursor: nip.length === 4 ? 'pointer' : 'not-allowed', opacity: nip.length === 4 ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}
                    >
                      <LogOut size={24} /> SALIDA
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden exit button for Admin */}
      <div 
        onClick={handleHiddenExit} 
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100px', height: '100px', cursor: 'default' }} 
        title="Admin Exit Area"
      />
    </div>
  );
};
