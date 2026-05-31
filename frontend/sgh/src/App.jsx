import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import ChangePasswordPage from './components/auth/ChangePasswordPage';
import AdminDashboard from './components/admin/AdminDashboard';
import ReceptionistDashboard from './components/receptionist/ReceptionistDashboard';
import NurseDashboard from './components/nurse/NurseDashboard';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="page-loading"><span className="spinner--page" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, isLoading, mustChangePassword, currentUser } = useAuth();

  if (isLoading) return <div className="page-loading"><span className="spinner--page" /></div>;

  if (isAuthenticated) {
    if (mustChangePassword) return <Navigate to="/trocar-senha" replace />;

    const roleRoutes = {
      admin: '/admin/dashboard',
      medic: '/medic/dashboard',
      nurse: '/nurse/dashboard',
      receptionist: '/receptionist/dashboard',
      patient: '/patient/dashboard',
    };
    const dest = roleRoutes[currentUser?.role?.toLowerCase()] ?? '/';
    return <Navigate to={dest} replace />;
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/"
      element={
        <RedirectIfAuthenticated>
          <LoginPage />
        </RedirectIfAuthenticated>
      }
    />
    <Route
      path="/trocar-senha"
      element={
        <RequireAuth>
          <ChangePasswordPage />
        </RequireAuth>
      }
    />
    <Route
      path="/admin/dashboard"
      element={
        <RequireAuth>
          <AdminDashboard />
        </RequireAuth>
      }
    />
    <Route
      path="/receptionist/dashboard"
      element={
        <RequireAuth>
          <ReceptionistDashboard />
        </RequireAuth>
      }
    />
    <Route
      path="/nurse/dashboard"
      element={
        <RequireAuth>
          <NurseDashboard />
        </RequireAuth>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
