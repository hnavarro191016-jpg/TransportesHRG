import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCog, ShieldCheck, CheckCircle, XCircle, AlertCircle, Plus, X, UserPlus } from 'lucide-react';

export const UsersView = () => {
  const { data, activeRole, activeUser, updateUser, register, fetchFromSupabase, addToast } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Pendiente'
  });

  const roleDescriptions = [
    { role: 'Administrador', desc: 'Acceso total a todos los módulos y configuraciones del sistema.' },
    { role: 'Encargado de almacén', desc: 'Gestión de productos, entradas, salidas, transferencias, conteos físicos y reportes.' },
    { role: 'Compras', desc: 'Administración de proveedores, registro de ordenes de compra y entradas.' },
    { role: 'Mecánico', desc: 'Consulta de refacciones, catálogo de flota y apertura/cierre de órdenes de trabajo (OT).' },
    { role: 'Gerencia', desc: 'Acceso de lectura a Dashboard de indicadores, alertas y reportes financieros.' }
  ];

  if (activeRole !== 'Administrador') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: '16px' }} />
        <h2>Acceso Restringido</h2>
        <p>Solo los Administradores pueden gestionar los accesos del sistema.</p>
      </div>
    );
  }

  const handleToggleActive = (user) => {
    if (user.id === activeUser?.id) {
      alert("No puedes desactivar tu propia cuenta.");
      return;
    }
    updateUser(user.id, { active: !user.active });
  };

  const handleChangeRole = (userId, newRole) => {
    updateUser(userId, { role: newRole });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const authData = await register(newUser.name, newUser.email, newUser.password);
      
      // Delay slightly as the supabase trigger might take a moment to insert into romo_users
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (authData?.user?.id) {
        await updateUser(authData.user.id, { role: newUser.role, active: true });
      }
      
      await fetchFromSupabase();
      addToast('Usuario creado con éxito', 'success');
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'Pendiente' });
    } catch (error) {
      addToast(`Error al crear usuario: ${error.message}`, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCog size={24} style={{ color: 'var(--color-secondary)' }} /> Administración de Usuarios
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Otorga acceso a nuevos empleados y gestiona sus roles en el sistema.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Crear Nuevo Usuario
        </button>
      </div>

      {/* Users list table */}
      <div className="content-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '16px' }}>
          Lista de Usuarios Registrados
        </h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre de Usuario</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Estado (Acceso)</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.users?.map((usr) => (
                <tr key={usr.id} style={{ background: !usr.active ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                  <td style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{usr.name} {usr.id === activeUser?.id && '(Tú)'}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{usr.email}</td>
                  <td>
                    <select 
                      className="form-control" 
                      style={{ padding: '6px', fontSize: '0.85rem', width: 'auto' }}
                      value={usr.role}
                      onChange={(e) => handleChangeRole(usr.id, e.target.value)}
                      disabled={usr.id === activeUser?.id}
                    >
                      {roleDescriptions.map(r => (
                        <option key={r.role} value={r.role}>{r.role}</option>
                      ))}
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </td>
                  <td>
                    {usr.active ? (
                      <span className="badge badge-success"><CheckCircle size={14} style={{marginRight: 4}}/> Activo</span>
                    ) : (
                      <span className="badge badge-danger"><XCircle size={14} style={{marginRight: 4}}/> Bloqueado</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className={usr.active ? "btn btn-danger btn-sm" : "btn btn-success btn-sm"}
                      onClick={() => handleToggleActive(usr)}
                      disabled={usr.id === activeUser?.id}
                    >
                      {usr.active ? 'Revocar Acceso' : 'Autorizar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles Matrix description card */}
      <div className="content-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-secondary)' }} /> Matriz de Permisos
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {roleDescriptions.map((rd, idx) => (
            <div key={idx} style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <span className="badge badge-gold" style={{ marginBottom: '8px' }}>{rd.role}</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: '1.4', marginTop: '4px' }}>{rd.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-main)', padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--color-primary)' }} /> Crear Nuevo Usuario
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Juan Pérez"
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="juan@transportesromo.com"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>Contraseña</label>
                <input 
                  type="password" 
                  className="form-control"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>Rol Inicial</label>
                <select 
                  className="form-control"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="Pendiente">Pendiente (Sin accesos)</option>
                  {roleDescriptions.map(r => (
                    <option key={r.role} value={r.role}>{r.role}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
