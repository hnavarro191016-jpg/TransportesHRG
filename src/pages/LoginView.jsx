import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export const LoginView = () => {
  const { login, register, addToast } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        // On success, App.jsx will automatically route to MainLayout if active
      } else {
        if (!name) throw new Error("El nombre es requerido");
        await register(name, email, password);
        addToast("Registro exitoso. Tu cuenta está en espera de autorización.", "success");
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        width: '100%',
        maxWidth: '420px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Branding */}
        <div style={{
          background: 'var(--bg-card-hover)',
          padding: '32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <img 
            src="/logo.jpg" 
            alt="Transportes HRG Logo" 
            style={{ height: '56px', objectFit: 'contain', marginBottom: '16px' }} 
          />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Control de Inventario
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Acceso exclusivo a personal autorizado
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: 'none',
              borderBottom: isLogin ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: isLogin ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: 'none',
              borderBottom: !isLogin ? '3px solid var(--color-secondary)' : '3px solid transparent',
              color: !isLogin ? 'var(--color-secondary)' : 'var(--color-text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Solicitar Acceso
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          
          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              fontWeight: 600,
              lineHeight: '1.4'
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                placeholder="usuario@transporteshrg.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={isLogin ? 'btn btn-gold' : 'btn btn-primary'}
              disabled={loading}
              style={{ marginTop: '8px', width: '100%', padding: '12px' }}
            >
              {loading ? 'Procesando...' : isLogin ? (
                <><LogIn size={18} /> Iniciar Sesión</>
              ) : (
                <><UserPlus size={18} /> Registrarse</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
