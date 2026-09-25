import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastNotification } from './components/ToastNotification';

import { DashboardView } from './pages/DashboardView';
import { ProductsView } from './pages/ProductsView';
import { CategoriesBrandsView } from './pages/CategoriesBrandsView';
import { WarehousesView } from './pages/WarehousesView';
import { SuppliersView } from './pages/SuppliersView';
import { UnitsView } from './pages/UnitsView';
import { PurchasesView } from './pages/PurchasesView';
import { ExitsView } from './pages/ExitsView';
import { WorkOrdersView } from './pages/WorkOrdersView';
import { PhysicalInventoryView } from './pages/PhysicalInventoryView';
import { KardexView } from './pages/KardexView';
import { AlertsView } from './pages/AlertsView';
import { ReportsView } from './pages/ReportsView';
import { UsersView } from './pages/UsersView';
import { LoginView } from './pages/LoginView';
import { useApp } from './context/AppContext';
import { ModuleHubView } from './pages/ModuleHubView';
import { MonitoreoView } from './pages/MonitoreoView';

import { SidebarHR } from './components/SidebarHR';
import { SidebarCapacitaciones } from './components/SidebarCapacitaciones';
import { SidebarAdmin } from './components/SidebarAdmin';
import { SidebarMantenimiento } from './components/SidebarMantenimiento';

import { DashboardHRView } from './pages/hr/DashboardHRView';
import { EmployeesView } from './pages/hr/EmployeesView';
import { AttendanceView } from './pages/hr/AttendanceView';
import { KioskView } from './pages/hr/KioskView';
import { DocumentosView } from './pages/hr/DocumentosView';
import { AlertasView } from './pages/hr/AlertasView';
import { WorkOrdersView as MantenimientosWorkOrdersView } from './pages/mantenimientos/WorkOrdersView';
import { DespachoView } from './pages/mantenimientos/DespachoView';
import { MantenimientoDashboard } from './pages/mantenimientos/MantenimientoDashboard';
import { ReporterWizard } from './pages/mantenimientos/ReporterWizard';

import { CourseCatalogView } from './pages/capacitaciones/CourseCatalogView';
import { MyCoursesView } from './pages/capacitaciones/MyCoursesView';
import { AdminCoursesView } from './pages/capacitaciones/AdminCoursesView';
import { CourseViewerView } from './pages/capacitaciones/CourseViewerView';
import { ExamViewerView } from './pages/capacitaciones/ExamViewerView';
import { DashboardCapacitacionesView } from './pages/capacitaciones/DashboardCapacitacionesView';

const MainLayout = () => {
  const { session, authLoading, activeUser, logout, activeRole } = useApp();
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('currentView') || 'dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModule, setActiveModule] = useState(() => localStorage.getItem('activeModule') || null);

  React.useEffect(() => {
    if (activeModule) localStorage.setItem('activeModule', activeModule);
    else localStorage.removeItem('activeModule');
  }, [activeModule]);

  React.useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  const isInitialMount = React.useRef(true);
  
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (activeModule === 'capacitaciones') {
      setCurrentView('catalogo');
    } else if (activeModule === 'administracion') {
      setCurrentView('usuarios');
    } else if (activeModule === 'mantenimientos') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('dashboard');
    }
  }, [activeModule]);

  const renderView = () => {
    if (activeModule === 'recursos_humanos') {
      switch (currentView) {
        case 'dashboard':
          return <DashboardHRView setCurrentView={setCurrentView} />;
        case 'empleados':
          return <EmployeesView />;
        case 'asistencias':
          return <AttendanceView />;
        case 'documentos':
          return <DocumentosView />;
        case 'alertas':
          return <AlertasView />;
        default:
          return <div style={{padding: '20px'}}><h3>Modulo en construccion</h3></div>;
      }
    }

    if (activeModule === 'administracion') {
      return <UsersView />;
    }

    if (activeModule === 'monitoreo') {
      return <MonitoreoView />;
    }

    if (activeModule === 'mantenimientos') {
      if (activeRole === 'Operador') {
        return <ReporterWizard />;
      }
      switch (currentView) {
        case 'dashboard':
          return <MantenimientoDashboard setCurrentView={setCurrentView} />;
        case 'work_orders':
          return <MantenimientosWorkOrdersView />;
        case 'despacho':
          return <DespachoView />;
        case 'report_incident':
          return <ReporterWizard setCurrentView={setCurrentView} />;
        default:
          return <MantenimientoDashboard setCurrentView={setCurrentView} />;
      }
    }

    if (activeModule === 'capacitaciones') {
      switch (currentView) {
        case 'dashboard':
          return <DashboardCapacitacionesView />;
        case 'ver_curso':
          return <CourseViewerView courseId={selectedCourse} setCurrentView={setCurrentView} />;
        case 'examen':
          return <ExamViewerView courseId={selectedCourse} setCurrentView={setCurrentView} />;
        case 'mis_capacitaciones':
          return <MyCoursesView setCurrentView={setCurrentView} setSelectedCourse={setSelectedCourse} />;
        case 'catalogo':
          return <CourseCatalogView />;
        case 'admin_cursos':
          return <AdminCoursesView />;
        default:
          return <DashboardCapacitacionesView />;
      }
    }

    // Default to Inventarios
    switch (currentView) {
      case 'dashboard':
        return <DashboardView setCurrentView={setCurrentView} />;
      case 'productos':
        return <ProductsView globalSearch={searchTerm} />;
      case 'categorias':
        return <CategoriesBrandsView />;
      case 'almacenes':
        return <WarehousesView />;
      case 'proveedores':
        return <SuppliersView />;
      case 'unidades':
        return <UnitsView />;
      case 'compras':
        return <PurchasesView />;
      case 'salidas':
        return <ExitsView />;
      case 'ordenes':
        return <WorkOrdersView />;
      case 'inventarioFisico':
        return <PhysicalInventoryView />;
      case 'kardex':
        return <KardexView globalSearch={searchTerm} />;
      case 'alertas':
        return <AlertsView setCurrentView={setCurrentView} />;
      case 'reportes':
        return <ReportsView />;
      case 'usuarios':
        return <UsersView />;
      default:
        return <DashboardView setCurrentView={setCurrentView} />;
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--color-text-main)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="spinner" style={{ border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></span>
          Cargando Sistema...
        </h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  if (session && !activeUser) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--color-text-main)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <span className="spinner" style={{ border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></span>
          Cargando perfil de usuario...
        </h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        
        {/* Escape hatch for users stuck due to DB mismatch */}
        <button onClick={logout} className="btn btn-dark" style={{ opacity: 0.7 }}>
          Cancelar / Cerrar Sesión
        </button>
      </div>
    );
  }

  if (session && activeUser && !activeUser.active) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--color-text-main)', padding: '24px', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>Acceso Denegado</h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
            Tu cuenta está registrada pero inactiva. Contacta al administrador para que autorice tu acceso al sistema.
          </p>
          <button onClick={logout} className="btn btn-dark" style={{ width: '100%' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (activeModule === 'kiosko') {
    return <KioskView setActiveModule={setActiveModule} />;
  }

  if (activeModule === null) {
    return <ModuleHubView setActiveModule={setActiveModule} />;
  }

  if (currentView === 'ver_curso' || currentView === 'examen') {
    return (
      <div className="app-container" style={{ display: 'block', height: '100vh', overflow: 'auto' }}>
        {renderView()}
      </div>
    );
  }

  return (
    <div className="app-container">
      {activeRole !== 'Operador' && (
        activeModule === 'recursos_humanos' ? (
          <SidebarHR currentView={currentView} setCurrentView={setCurrentView} />
        ) : activeModule === 'capacitaciones' ? (
          <SidebarCapacitaciones currentView={currentView} setCurrentView={setCurrentView} />
        ) : activeModule === 'mantenimientos' ? (
          <SidebarMantenimiento currentView={currentView} setCurrentView={setCurrentView} />
        ) : activeModule === 'administracion' ? (
          <SidebarAdmin currentView={currentView} setCurrentView={setCurrentView} />
        ) : activeModule === 'monitoreo' ? null : (
          <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        )
      )}
      <div className="main-content">
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          activeModule={activeModule}
          setActiveModule={setActiveModule}
        />
        <main className="page-wrapper">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <ToastNotification />
    </AppProvider>
  );
}
