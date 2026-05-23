import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthShell from '../layout/AuthShell';
import AlertMessage from '../ui/AlertMessage';

const heroMetrics = [
  { value: 'Segurança', label: 'Primeiro acesso' },
  { value: 'Token ativo', label: 'Sessão validada' },
  { value: '1 passo', label: 'Troca obrigatória' },
];

const ChangePassword = () => {
  const { changePassword, currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ message: '', type: 'info' });

    if (!formData.senhaAtual || !formData.novaSenha || !formData.confirmarNovaSenha) {
      setFeedback({ message: 'Por favor, preencha todos os campos.', type: 'error' });
      return;
    }

    if (formData.novaSenha !== formData.confirmarNovaSenha) {
      setFeedback({ message: 'A nova senha e a confirmação não coincidem.', type: 'error' });
      return;
    }

    const result = await changePassword(formData.senhaAtual, formData.novaSenha, formData.confirmarNovaSenha);

    if (!result.success) {
      setFeedback({ message: result.error, type: 'error' });
      return;
    }

    setFeedback({ message: 'Senha alterada com sucesso! Redirecionando...', type: 'success' });

    window.setTimeout(() => {
      const roleRoutes = { admin: '/admin/dashboard', medic: '/medic/dashboard', nurse: '/nurse/dashboard', patient: '/patient/dashboard' };
      navigate(roleRoutes[currentUser?.role?.toLowerCase()] ?? '/');
    }, 1200);
  };

  return (
    <AuthShell
      title="Atualize sua senha antes de continuar."
      description="Esse passo protege a conta no primeiro acesso e mantém o fluxo de atendimento alinhado com a política de segurança do sistema."
      metrics={heroMetrics}
    >
      <div className="login-container">
        <div className="logo">
          <div className="logo-circle">#</div>
          <h2>Troca de Senha Obrigatória</h2>
          <p>Por segurança, você precisa definir uma nova senha antes de seguir.</p>
        </div>

        <AlertMessage message={feedback.message} type={feedback.type} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Senha Atual</label>
            <input
              id="currentPassword"
              name="senhaAtual"
              type="password"
              value={formData.senhaAtual}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Nova Senha</label>
            <input
              id="newPassword"
              name="novaSenha"
              type="password"
              value={formData.novaSenha}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirmar Nova Senha</label>
            <input
              id="confirmNewPassword"
              name="confirmarNovaSenha"
              type="password"
              value={formData.confirmarNovaSenha}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className={`btn ${isLoading ? 'is-loading' : ''}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="btn-loader" />
                Alterando...
              </>
            ) : (
              'Alterar Senha'
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default ChangePassword;
