import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Clock, Award, Shield } from 'lucide-react';

export const CourseCatalogView = () => {
  const { data } = useApp();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [profileFilter, setProfileFilter] = React.useState('');

  const courses = data.courses || [];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter ? course.category === categoryFilter : true;
    const matchesProfile = profileFilter ? course.profile === profileFilter : true;
    
    return matchesSearch && matchesCategory && matchesProfile && course.status === 'publicado';
  });

  // Extract unique categories and profiles for the filters
  const categories = [...new Set(courses.map(c => c.category))];
  const profiles = [...new Set(courses.map(c => c.profile))];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>Catálogo de Cursos</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Explora la oferta educativa y de capacitación continua de HRG.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar curso..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
          </div>
          
          <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select className="form-control" value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}>
            <option value="">Todos los perfiles</option>
            {profiles.map(prof => <option key={prof} value={prof}>{prof}</option>)}
          </select>
        </div>
      </div>

      {/* Course Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <div key={course.id} className="content-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ 
                height: '140px', 
                background: course.coverImageUrl ? `url(${course.coverImageUrl}) center/cover` : 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {!course.coverImageUrl && <Shield size={48} color="var(--color-text-muted)" opacity={0.5} />}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className="badge badge-info">{course.category}</span>
                </div>
              </div>
              
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {course.profile}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 12px 0' }}>{course.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 20px 0', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '16px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    <Clock size={14} /> {course.durationMinutes} min
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    <Award size={14} /> Mín. {course.minScoreRequired}%
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
            <Library size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>No se encontraron cursos</h3>
            <p style={{ margin: 0 }}>Intenta modificar los filtros de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};
