import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, FileText } from 'lucide-react';

export const DocumentosView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase.from('romo_users').select('id, name');
      const { data: profilesData, error: profilesError } = await supabase.from('romo_hr_profiles').select('user_id, ine_doc_url, licencia_doc_url');
      
      if (usersData && profilesData) {
        const combined = usersData.map(user => {
          const profile = profilesData.find(p => p.user_id === user.id) || {};
          return {
            id: user.id,
            name: user.name || 'Sin nombre',
            ine_doc_url: profile.ine_doc_url || '',
            licencia_doc_url: profile.licencia_doc_url || ''
          };
        }).filter(emp => emp.ine_doc_url || emp.licencia_doc_url); 
        setDocuments(combined);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filtered = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Expedientes y Documentos</h2>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>INE</th>
                <th>Licencia</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>Cargando documentos...</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{doc.name}</div>
                    </td>
                    <td>
                      {doc.ine_doc_url ? (
                        <a href={doc.ine_doc_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', gap: '5px' }}>
                          <FileText size={16} /> Ver INE
                        </a>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>N/D</span>}
                    </td>
                    <td>
                      {doc.licencia_doc_url ? (
                        <a href={doc.licencia_doc_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', gap: '5px' }}>
                          <FileText size={16} /> Ver Licencia
                        </a>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>N/D</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No se encontraron documentos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
