import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AlertMessage from '../ui/AlertMessage';

const ROLE_ROUTES = {
  admin: '/admin/dashboard',
  medic: '/medic/dashboard',
  nurse: '/nurse/dashboard',
  receptionist: '/receptionist/dashboard',
  patient: '/patient/dashboard',
};

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');

  const handleChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.email, formData.senha);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.mustChangePassword) {
      navigate('/trocar-senha');
      return;
    }

    navigate(ROLE_ROUTES[result.user?.role?.toLowerCase()] ?? '/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">+</div>
          <div>
            <div className="brand-name">SGH</div>
            <div className="brand-subtitle">Sistema de Gestão Hospitalar</div>
          </div>
        </div>

        <h1 className="auth-heading">Entrar</h1>
        <p className="auth-subheading">Acesse com seu e-mail e senha cadastrados.</p>

        <AlertMessage message={error} type="error" />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@hospital.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              placeholder="••••••••"
              value={formData.senha}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading && <span className="spinner" />}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
