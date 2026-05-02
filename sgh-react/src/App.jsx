import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/auth/LoginScreen';
import ChangePassword from './components/auth/ChangePassword';
import AdminDashboard from './components/admin/AdminDashboard';
import DoctorManagementPage from './components/admin/DoctorManagementPage';
import ScreeningManagementPage from './components/admin/ScreeningManagementPage';
import PatientDashboard from './components/patient/PatientDashboard';

const normalizeRole = (role) => role?.toLowerCase?.() ?? '';

const ProtectedRoute = ({ children, requiredRole }) => {
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

  if (requiredRole && normalizeRole(currentUser?.role) !== requiredRole) {
    return <Navigate to={normalizeRole(currentUser?.role) === 'admin' ? '/admin' : '/paciente'} replace />;
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

  return <Navigate to={normalizeRole(currentUser?.role) === 'admin' ? '/admin' : '/paciente'} replace />;
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
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
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
            path="/paciente"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
