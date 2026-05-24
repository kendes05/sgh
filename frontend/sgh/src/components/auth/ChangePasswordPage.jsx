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

const ChangePasswordPage = () => {
  const { changePassword, currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });
  const [feedback, setFeedback] = useState({ message: '', type: 'error' });

  const handleChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ message: '', type: 'error' });

    if (formData.novaSenha !== formData.confirmarNovaSenha) {
      setFeedback({ message: 'A nova senha e a confirmação não coincidem.', type: 'error' });
      return;
    }

    if (formData.novaSenha === formData.senhaAtual) {
      setFeedback({ message: 'A nova senha deve ser diferente da senha atual.', type: 'error' });
      return;
    }

    const result = await changePassword(
      formData.senhaAtual,
      formData.novaSenha,
      formData.confirmarNovaSenha,
    );

    if (!result.success) {
      setFeedback({ message: result.error, type: 'error' });
      return;
    }

    setFeedback({ message: 'Senha alterada com sucesso. Redirecionando...', type: 'success' });

    setTimeout(() => {
      navigate(ROLE_ROUTES[currentUser?.role?.toLowerCase()] ?? '/');
    }, 1200);
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

        <h1 className="auth-heading">Troca de senha obrigatória</h1>
        <p className="auth-subheading">
          Este é seu primeiro acesso. Defina uma nova senha para continuar.
        </p>

        <AlertMessage message={feedback.message} type={feedback.type} />

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="senhaAtual">Senha atual</label>
            <input
              id="senhaAtual"
              name="senhaAtual"
              type="password"
              placeholder="Senha temporária recebida"
              value={formData.senhaAtual}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              name="novaSenha"
              type="password"
              placeholder="Nova senha"
              value={formData.novaSenha}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmarNovaSenha">Confirmar nova senha</label>
            <input
              id="confirmarNovaSenha"
              name="confirmarNovaSenha"
              type="password"
              placeholder="Repita a nova senha"
              value={formData.confirmarNovaSenha}
              onChange={handleChange}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading && <span className="spinner" />}
            {isLoading ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
