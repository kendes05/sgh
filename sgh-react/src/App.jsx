import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/auth/LoginScreen';
import ChangePassword from './components/auth/ChangePassword';
import AdminDashboard from './components/dashboard/AdminDashboard';
import MedicDashboard from './components/dashboard/MedicDashboard';
import NurseDashboard from './components/dashboard/NurseDashboard';
import PatientDashboard from './components/dashboard/PatientDashboard';
import LegacyAdminDashboard from './components/admin/AdminDashboard';
import DoctorManagementPage from './components/admin/DoctorManagementPage';
import ScreeningManagementPage from './components/admin/ScreeningManagementPage';

const normalizeRole = (role) => role?.toLowerCase?.() ?? '';

const getDashboardRouteForRole = (role) => {
  switch (normalizeRole(role)) {
    case 'admin':
      return '/admin/dashboard';
    case 'medic':
      return '/medic/dashboard';
    case 'nurse':
      return '/nurse/dashboard';
    case 'patient':
      return '/patient/dashboard';
    default:
      return '/';
  }
};

const ProtectedRoute = ({ children, requiredRole, requiredRoles }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="container content">
          <div className="loading">
            <div className="spinner" />
            <p className="loading-title">Carregando...</p>
            <p className="loading-copy">Estamos preparando seu acesso ao SGH.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const normalizedRole = normalizeRole(currentUser?.role);

  if (requiredRole && normalizedRole !== requiredRole) {
    return <Navigate to={getDashboardRouteForRole(currentUser?.role)} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(normalizedRole)) {
    return <Navigate to={getDashboardRouteForRole(currentUser?.role)} replace />;
  }

  return children;
};

const RoleBasedRedirect = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="container content">
          <div className="loading">
            <div className="spinner" />
            <p className="loading-title">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Navigate to={getDashboardRouteForRole(currentUser?.role)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route
            path="/trocar-senha"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pacientes"
            element={
              <ProtectedRoute requiredRole="admin">
                <LegacyAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profissionais"
            element={
              <ProtectedRoute requiredRole="admin">
                <DoctorManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/triagens"
            element={
              <ProtectedRoute requiredRole="admin">
                <ScreeningManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medic/dashboard"
            element={
              <ProtectedRoute requiredRole="medic">
                <MedicDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurse/dashboard"
            element={
              <ProtectedRoute requiredRole="nurse">
                <NurseDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/screenings"
            element={
              <ProtectedRoute requiredRoles={['admin', 'medic', 'nurse']}>
                <ScreeningManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paciente"
            element={<Navigate to="/patient/dashboard" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
