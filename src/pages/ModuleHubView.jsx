import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Package, Users, Wrench, GraduationCap, Lock, MessageSquare, Settings, MapPin, Fingerprint } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const ModuleHubView = ({ setActiveModule }) => {
  const { activeRole, activeUser, logout } = useApp();
  const [recentMessages, setRecentMessages] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!isSupabaseConfigured()) {
        setFetchError('Supabase no está configurado (isSupabaseConfigured regresó false)');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('romo_work_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        console.log('Supabase fetch result:', { data, error });
        
        if (error) {
          setFetchError(JSON.stringify(error));
        } else if (data) {
          setFetchError(null);
          setRecentMessages(data);
        }
      } catch (err) {
        setFetchError(err.message);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const modules = [
    {
      id: 'inventarios',
      title: 'Inventarios',
      description: 'Control y supervisión de almacén de refacciones',
      icon: <Package size={48} />,
      color: '#d4af37', // Gold
      allowedRoles: ['Administrador', 'Encargado de almacén', 'Mecánico', 'Compras', 'Gerencia', 'Operador']
    },
    {
      id: 'recursos_humanos',
      title: 'Recursos Humanos',
      description: 'Gestión de personal y expedientes',
      icon: <Users size={48} />,
      color: '#2563eb', // Blue
      allowedRoles: ['Administrador']
    },
    {
      id: 'mantenimientos',
      title: 'Mantenimientos',
      description: 'Órdenes de servicio y mecánica de la flota',
      icon: <Wrench size={48} />,
      color: '#16a34a', // Green
      allowedRoles: ['Administrador', 'Mecánico', 'Gerencia', 'Operador']
    },
    {
      id: 'capacitaciones',
      title: 'Capacitaciones',
      description: 'Plataforma de adiestramiento continuo',
      icon: <GraduationCap size={48} />,
      color: '#9333ea', // Purple
      allowedRoles: ['Administrador']
    },
    {
      id: 'monitoreo',
      title: 'Monitoreo',
      description: 'Rastreo GPS en vivo',
      icon: <MapPin size={48} />,
      color: '#14b8a6', // Teal
      allowedRoles: ['Administrador', 'Gerencia']
    },
    {
      id: 'administracion',
      title: 'Administración',
      description: 'Gestión de usuarios, permisos y configuración global',
      icon: <Settings size={48} />,
      color: '#475569', // Slate/Gray
      allowedRoles: ['Administrador']
    },
    {
      id: 'kiosko',
      title: 'Modo Kiosco',
      description: 'Checador digital para la base (tablet)',
      icon: <Fingerprint size={48} />,
      color: '#0f172a', // Dark Slate
      allowedRoles: ['Administrador']
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-surface)', color: 'var(--color-text-main)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src="/logo.jpg" alt="Transportes Romo Logo" style={{ height: '70px', borderRadius: '8px' }} />
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Portal Empresarial</h1>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 500 }}>Transportes Romo</h2>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{activeUser?.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{activeRole}</div>
            </div>
            <button onClick={logout} className="btn btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px' }}>Selecciona un Módulo</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {modules.map(mod => {
            const hasAccess = mod.allowedRoles.includes(activeRole);
            
            return (
              <button
                key={mod.id}
                onClick={() => hasAccess && setActiveModule(mod.id)}
                disabled={!hasAccess}
                className="content-card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  padding: '30px', 
                  textAlign: 'left',
                  cursor: hasAccess ? 'pointer' : 'not-allowed',
                  opacity: hasAccess ? 1 : 0.6,
                  border: '1px solid var(--color-border)',
                  borderTop: `4px solid ${mod.color}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  background: 'var(--bg-surface)'
                }}
              >
                {!hasAccess && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-text-muted)' }}>
                    <Lock size={20} />
                  </div>
                )}
                
                <div style={{ color: mod.color, marginBottom: '20px' }}>
                  {mod.icon}
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text-main)' }}>
                  {mod.title}
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.5' }}>
                  {mod.description}
                </p>
                
                {!hasAccess && (
                  <div style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                    Acceso denegado para tu rol
                  </div>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
