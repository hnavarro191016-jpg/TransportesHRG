import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';

export const EmployeesView = () => {
  const { data, fetchFromSupabase, activeUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ineFile, setIneFile] = useState(null);
  const [licenciaFile, setLicenciaFile] = useState(null);

  const fetchEmployeesData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase.from('romo_users').select('*');
      const { data: profilesData, error: profilesError } = await supabase.from('romo_hr_profiles').select('*');
      
      if (usersData) {
        const combined = usersData.map(user => {
          const profile = (profilesData || []).find(p => p.user_id === user.id) || {};
          const nameParts = user.name ? user.name.split(' ') : [''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          return {
            id: user.id,
            firstName,
            lastName,
            name: user.name,
            department: profile.department || 'Taller',
            position: profile.position || '',
            curp: profile.curp || '',
            rfc: profile.rfc || '',
            nss: profile.nss || '',
            hireDate: profile.hire_date || '',
            bloodType: profile.blood_type || '',
            emergencyContact: profile.emergency_contact || '',
            emergencyPhone: profile.emergency_phone || '',
            licenseNumber: profile.license_number || '',
            licenseExpiry: profile.license_expiry || '',
            ine_doc_url: profile.ine_doc_url || '',
            licencia_doc_url: profile.licencia_doc_url || '',
            status: user.active ? 'activo' : 'inactivo',
            role: user.role || 'Operador',
            shift_start_time: profile.shift_start_time || '09:00:00',
            shift_end_time: profile.shift_end_time || '18:00:00',
            nip: profile.nip || ''
          };
        });
        setEmployees(combined);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: 'Taller',
    position: '',
    curp: '',
    rfc: '',
    nss: '',
    hireDate: '',
    bloodType: '',
    emergencyContact: '',
    emergencyPhone: '',
    licenseNumber: '',
    licenseExpiry: '',
    status: 'activo',
    role: 'Operador',
    shift_start_time: '09:00:00',
    shift_end_time: '18:00:00',
    nip: ''
  });

  const filteredEmployees = employees.filter(e => 
    (e.firstName + ' ' + e.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (employee = null) => {
    setIneFile(null);
    setLicenciaFile(null);
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        ...employee
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        department: 'Taller',
        position: '',
        curp: '',
        rfc: '',
        nss: '',
        hireDate: '',
        bloodType: '',
        emergencyContact: '',
        emergencyPhone: '',
        licenseNumber: '',
        licenseExpiry: '',
        status: 'activo',
        role: 'Operador',
        shift_start_time: '09:00:00',
        shift_end_time: '18:00:00',
        nip: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      let userId = editingEmployee ? editingEmployee.id : crypto.randomUUID();

      const userPayload = {
        name: fullName,
        active: formData.status === 'activo',
        role: formData.role
      };

      let userError = null;
      if (editingEmployee) {
        // Si existe, actualizamos para no romper columnas NOT NULL como email
        const res = await supabase.from('romo_users').update(userPayload).eq('id', userId);
        userError = res.error;
      } else {
        // Si es nuevo, necesitamos generar un email dummy temporal porque es NOT NULL
        userPayload.id = userId;
        userPayload.email = `${userId.substring(0,8)}@transportesromo.com`;
        const res = await supabase.from('romo_users').insert([userPayload]);
        userError = res.error;
      }
      
      if (userError) {
        console.error("Supabase Error romo_users:", userError);
        alert('Error al guardar usuario: ' + userError.message);
        return;
      }

      let ineUrl = editingEmployee?.ine_doc_url || null;
      let licenciaUrl = editingEmployee?.licencia_doc_url || null;

      if (ineFile) {
        const ext = ineFile.name.split('.').pop();
        const filePath = `${userId}/ine_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('hr_documents').upload(filePath, ineFile);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('hr_documents').getPublicUrl(filePath);
          ineUrl = publicUrlData.publicUrl;
        } else {
          console.error("Error uploading INE:", uploadError);
        }
      }

      if (licenciaFile) {
        const ext = licenciaFile.name.split('.').pop();
        const filePath = `${userId}/licencia_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('hr_documents').upload(filePath, licenciaFile);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('hr_documents').getPublicUrl(filePath);
          licenciaUrl = publicUrlData.publicUrl;
        } else {
          console.error("Error uploading Licencia:", uploadError);
        }
      }

      const profilePayload = {
        user_id: userId,
        department: formData.department,
        position: formData.position,
        curp: formData.curp,
        rfc: formData.rfc,
        nss: formData.nss,
        hire_date: formData.hireDate || null,
        blood_type: formData.bloodType,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone,
        license_number: formData.licenseNumber,
        license_expiry: formData.licenseExpiry || null,
        shift_start_time: formData.shift_start_time || '09:00:00',
        shift_end_time: formData.shift_end_time || '18:00:00',
        nip: formData.nip || '1234',
        ine_doc_url: ineUrl,
        licencia_doc_url: licenciaUrl
      };

      let profileError = null;
      if (editingEmployee) {
        const res = await supabase.from('romo_hr_profiles').update(profilePayload).eq('user_id', userId);
        profileError = res.error;
      } else {
        const res = await supabase.from('romo_hr_profiles').insert([profilePayload]);
        profileError = res.error;
      }
      
      if (profileError) {
        console.error("Supabase Error romo_hr_profiles:", profileError);
        alert('Error de base de datos en perfil: ' + profileError.message);
        return;
      }

      await fetchEmployeesData();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Try/Catch Error:", err);
      alert('Excepción al guardar: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este empleado (y su acceso)?')) {
      await supabase.from('romo_hr_profiles').delete().eq('user_id', id);
      await supabase.from('romo_users').delete().eq('id', id);
      await fetchEmployeesData();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Directorio de Empleados</h2>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Empleado
        </button>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o puesto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Cargando empleados...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Departamento</th>
                  <th>Puesto</th>
                  <th>Horario</th>
                  <th>Licencia</th>
                  <th>Estatus</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td>{emp.shift_start_time} - {emp.shift_end_time}</td>
                    <td>
                      {emp.licenseNumber ? (
                        <div>
                          {emp.licenseNumber}
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vence: {emp.licenseExpiry}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'activo' ? 'badge-success' : 'badge-warning'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleOpenModal(emp)} style={{ marginRight: '8px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDelete(emp.id)} style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                      No hay empleados registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ overflowY: 'auto', padding: '20px 0' }}>
          <div className="modal-content" style={{ maxWidth: '800px', margin: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>Datos Personales y de Sistema</h4>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nombre(s)</label>
                  <input className="form-control" type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input className="form-control" type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <select className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    <option value="Taller">Taller</option>
                    <option value="Operaciones">Operaciones (Choferes)</option>
                    <option value="Almacén">Almacén</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Puesto</label>
                  <input className="form-control" type="text" required placeholder="Ej: Chofer, Mecánico A" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol de Sistema</label>
                  <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="Operador">Operador (Solo Kiosco)</option>
                    <option value="Taller">Taller (Acceso Mantenimiento)</option>
                    <option value="Almacén">Almacén (Acceso Inventario)</option>
                    <option value="Admin">Admin (Acceso Total)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estatus</label>
                  <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo / Baja</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px' }}>Horario y Acceso Kiosco</h4>
                </div>

                <div className="form-group">
                  <label className="form-label">Horario de Entrada (HH:MM)</label>
                  <input className="form-control" type="time" required value={formData.shift_start_time} onChange={e => setFormData({...formData, shift_start_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Horario de Salida (HH:MM)</label>
                  <input className="form-control" type="time" required value={formData.shift_end_time} onChange={e => setFormData({...formData, shift_end_time: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">NIP (4 dígitos)</label>
                  <input className="form-control" type="text" maxLength="4" pattern="\d{4}" placeholder="Ej: 1234" required value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px' }}>Datos Administrativos</h4>
                </div>

                <div className="form-group">
                  <label className="form-label">CURP</label>
                  <input className="form-control" type="text" value={formData.curp} onChange={e => setFormData({...formData, curp: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">RFC</label>
                  <input className="form-control" type="text" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">NSS (Seguro Social)</label>
                  <input className="form-control" type="text" value={formData.nss} onChange={e => setFormData({...formData, nss: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Ingreso</label>
                  <input className="form-control" type="date" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Contacto de Emergencia</label>
                  <input className="form-control" type="text" placeholder="Nombre de familiar" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono Emergencia</label>
                  <input className="form-control" type="text" value={formData.emergencyPhone} onChange={e => setFormData({...formData, emergencyPhone: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de Sangre</label>
                  <input className="form-control" type="text" placeholder="O+" value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})} />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px', marginTop: '16px' }}>Documentos (Expediente) y Licencia</h4>
                </div>

                <div className="form-group">
                  <label className="form-label">INE (Archivo)</label>
                  <input className="form-control" type="file" accept="image/*,.pdf" onChange={e => setIneFile(e.target.files[0])} />
                  {editingEmployee?.ine_doc_url && <a href={editingEmployee.ine_doc_url} target="_blank" rel="noreferrer" style={{fontSize: '0.8rem', color: 'blue', display: 'block', marginTop: '4px'}}>Ver INE Actual</a>}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Número de Licencia</label>
                  <input className="form-control" type="text" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Licencia (Archivo)</label>
                  <input className="form-control" type="file" accept="image/*,.pdf" onChange={e => setLicenciaFile(e.target.files[0])} />
                  {editingEmployee?.licencia_doc_url && <a href={editingEmployee.licencia_doc_url} target="_blank" rel="noreferrer" style={{fontSize: '0.8rem', color: 'blue', display: 'block', marginTop: '4px'}}>Ver Licencia Actual</a>}
                </div>

                <div className="form-group">
                  <label className="form-label">Vencimiento Licencia</label>
                  <input className="form-control" type="date" value={formData.licenseExpiry} onChange={e => setFormData({...formData, licenseExpiry: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Empleado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
