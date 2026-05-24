import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { updateUserEmail } from '../../../services/api';
import AlertMessage from '../../ui/AlertMessage';

const PerfilTab = () => {
  const { currentUser, changePassword, updateUser } = useAuth();

  const [newEmail, setNewEmail]           = useState('');
  const [emailSaving, setEmailSaving]     = useState(false);
  const [emailFeedback, setEmailFeedback] = useState({ msg: '', type: 'success' });

  const [passForm, setPassForm]           = useState({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [passSaving, setPassSaving]       = useState(false);
  const [passFeedback, setPassFeedback]   = useState({ msg: '', type: 'success' });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === currentUser?.email) {
      setEmailFeedback({ msg: 'Informe um e-mail diferente do atual.', type: 'error' });
      return;
    }
    setEmailSaving(true);
    setEmailFeedback({ msg: '', type: 'success' });
    try {
      await updateUserEmail(currentUser.id, newEmail);
      if (typeof updateUser === 'function') updateUser({ email: newEmail });
      setNewEmail('');
      setEmailFeedback({ msg: 'E-mail atualizado com sucesso.', type: 'success' });
    } catch (err) {
      setEmailFeedback({ msg: err.message, type: 'error' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    setPassFeedback({ msg: '', type: 'success' });
    if (passForm.novaSenha !== passForm.confirmarNovaSenha) {
      setPassFeedback({ msg: 'A nova senha e a confirmação não coincidem.', type: 'error' });
      return;
    }
    if (passForm.novaSenha === passForm.senhaAtual) {
      setPassFeedback({ msg: 'A nova senha deve ser diferente da atual.', type: 'error' });
      return;
    }
    setPassSaving(true);
    const result = await changePassword(passForm.senhaAtual, passForm.novaSenha, passForm.confirmarNovaSenha);
    setPassSaving(false);
    if (!result.success) {
      setPassFeedback({ msg: result.error, type: 'error' });
    } else {
      setPassForm({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
      setPassFeedback({ msg: 'Senha alterada com sucesso.', type: 'success' });
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Meu perfil</div>
          <div className="section-subtitle">Gerencie seu acesso e informações pessoais</div>
        </div>
      </div>

      <div className="profile-card" style={{ marginBottom: 20 }}>
        <div className="profile-card-title">Dados da conta</div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div className="info-row">
            <span className="info-label">Nome</span>
            <span className="info-value">{currentUser?.nome ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">E-mail</span>
            <span className="info-value">{currentUser?.email ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cargo</span>
            <span className="info-value">Recepcionista</span>
          </div>
        </div>
      </div>

      <div className="profile-sections">
        <div className="profile-card">
          <div className="profile-card-title">Alterar e-mail</div>
          <AlertMessage message={emailFeedback.msg} type={emailFeedback.type} />
          <form onSubmit={handleEmailSubmit}>
            <div className="field">
              <label htmlFor="new-email">Novo e-mail</label>
              <input id="new-email" type="email" value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emailSaving} placeholder={currentUser?.email} required />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={emailSaving}>
              {emailSaving ? 'Salvando...' : 'Atualizar e-mail'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <div className="profile-card-title">Alterar senha</div>
          <AlertMessage message={passFeedback.msg} type={passFeedback.type} />
          <form onSubmit={handlePassSubmit}>
            <div className="field">
              <label htmlFor="senhaAtual">Senha atual</label>
              <input id="senhaAtual" name="senhaAtual" type="password"
                value={passForm.senhaAtual}
                onChange={(e) => setPassForm((p) => ({ ...p, senhaAtual: e.target.value }))}
                disabled={passSaving} required />
            </div>
            <div className="field">
              <label htmlFor="novaSenha">Nova senha</label>
              <input id="novaSenha" name="novaSenha" type="password"
                value={passForm.novaSenha}
                onChange={(e) => setPassForm((p) => ({ ...p, novaSenha: e.target.value }))}
                disabled={passSaving} required />
            </div>
            <div className="field">
              <label htmlFor="confirmarNovaSenha">Confirmar nova senha</label>
              <input id="confirmarNovaSenha" name="confirmarNovaSenha" type="password"
                value={passForm.confirmarNovaSenha}
                onChange={(e) => setPassForm((p) => ({ ...p, confirmarNovaSenha: e.target.value }))}
                disabled={passSaving} required />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={passSaving}>
              {passSaving ? 'Alterando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PerfilTab;
