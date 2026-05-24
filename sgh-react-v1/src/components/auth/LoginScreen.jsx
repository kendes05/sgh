import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthShell from '../layout/AuthShell';
import AlertMessage from '../ui/AlertMessage';

const heroMetrics = [
  { value: '24/7', label: 'Acesso seguro' },
  { value: '2 perfis', label: 'Admin e paciente' },
  { value: '1 lugar', label: 'Dados centralizados' },
];

const LoginScreen = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.mustChangePassword) {
      navigate('/trocar-senha');
      return;
    }

    const roleRoutes = {
      admin: '/admin/dashboard',
      medic: '/medic/dashboard',
      nurse: '/nurse/dashboard',
      patient: '/patient/dashboard',
    };
    navigate(roleRoutes[result.user.role?.toLowerCase()] ?? '/');
  };

  return (
    <AuthShell
      title="Gestão hospitalar com acesso rápido e visão clara do atendimento."
      description="Faça login para acompanhar pacientes, consultar dados e seguir com o fluxo do SGH sem depender de manipulação manual da tela."
      metrics={heroMetrics}
    >
      <div className="login-container">
        <div className="logo">
          <div className="logo-circle">+</div>
          <h2>SGH</h2>
          <p>Sistema de Gestão Hospitalar</p>
        </div>

        <AlertMessage message={error} type="error" />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className={`btn ${isLoading ? 'is-loading' : ''}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="btn-loader" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default LoginScreen;
