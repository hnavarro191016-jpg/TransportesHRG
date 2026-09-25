import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Award, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const DashboardCapacitacionesView = () => {
  const { data } = useApp();
  
  // Simulated stats for demo
  const stats = [
    { label: 'Empleados Capacitados', value: '142', icon: <Users size={24} />, color: 'var(--color-primary)' },
    { label: 'Certificados Emitidos', value: '385', icon: <Award size={24} />, color: 'var(--color-success)' },
    { label: 'Cursos por Vencer (30d)', value: '12', icon: <AlertTriangle size={24} />, color: 'var(--color-warning)' },
    { label: 'Cursos Vencidos', value: '3', icon: <AlertTriangle size={24} />, color: 'var(--color-danger)' },
  ];

  const complianceData = [
    { name: 'Operadores', cumplimento: 92 },
    { name: 'Mecánicos', cumplimento: 85 },
    { name: 'Monitoristas', cumplimento: 100 },
    { name: 'Administrativos', cumplimento: 78 }
  ];

  const statusData = [
    { name: 'Al corriente', value: 85, color: 'var(--color-success)' },
    { name: 'Por vencer', value: 10, color: 'var(--color-warning)' },
    { name: 'Vencidos', value: 5, color: 'var(--color-danger)' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>Dashboard Gerencial</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Visión general del estado de cumplimiento de capacitaciones en HRG.
          </p>
        </div>
        <button className="btn btn-outline">
          Exportar Reporte PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="content-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', 
              background: `${stat.color}20`, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="content-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Cumplimiento por Departamento</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip cursor={{ fill: 'var(--bg-main)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="cumplimento" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="content-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Estado Global</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {statusData.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.color }}></div>
                <span style={{ flex: 1 }}>{s.name}</span>
                <span style={{ fontWeight: 600 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
