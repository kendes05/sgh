import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import AlertMessage from '../../ui/AlertMessage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  const s = typeof d === 'string' ? d : String(d);
  const [y, m, day] = s.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const fmtCpf = (cpf) => {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const fmtBloodType = (bt) => bt?.replace('_POS', '+').replace('_NEG', '-') || '—';

const GENDER_LABELS = {
  MASCULINO: 'Masculino',
  FEMININO:  'Feminino',
  OUTRO:     'Outro',
};

// ─── Read-only field ──────────────────────────────────────────────────────────

const ReadField = ({ label, value }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, color: 'var(--text)' }}>{value || '—'}</div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const PerfilTab = ({ patient }) => {
  const { changePassword } = useAuth();

  const [passForm, setPassForm]         = useState({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
  const [passSaving, setPassSaving]     = useState(false);
  const [passFeedback, setPassFeedback] = useState({ msg: '', type: 'success' });

  const handlePassChange = ({ target: { name, value } }) =>
    setPassForm((prev) => ({ ...prev, [name]: value }));

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    setPassFeedback({ msg: '', type: 'success' });
    if (passForm.novaSenha !== passForm.confirmarNovaSenha) {
      setPassFeedback({ msg: 'A nova senha e a confirmação não coincidem.', type: 'error' }); return;
    }
    if (passForm.novaSenha === passForm.senhaAtual) {
      setPassFeedback({ msg: 'A nova senha deve ser diferente da atual.', type: 'error' }); return;
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
          <div className="section-subtitle">Seus dados cadastrais e configurações de acesso</div>
        </div>
      </div>

      {/* ── Dados pessoais (somente leitura) ───────────────────────── */}
      <div className="profile-card" style={{ marginBottom: 20 }}>
        <div className="profile-card-title">Dados pessoais</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Para atualizar seus dados, procure a recepção.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <ReadField label="Nome completo"   value={patient?.nome} />
          <ReadField label="E-mail"          value={patient?.email} />
          <ReadField label="CPF"             value={fmtCpf(patient?.cpf)} />
          <ReadField label="Data de nascimento" value={fmtDate(patient?.dataNascimento)} />
          <ReadField label="Gênero"          value={GENDER_LABELS[patient?.genero] || patient?.genero} />
          <ReadField label="Tipo sanguíneo"  value={fmtBloodType(patient?.tipoSanguineo)} />
          <ReadField label="Telefone"        value={patient?.telefone} />
          <ReadField label="Cartão SUS"      value={patient?.susCardNumber || 'Não cadastrado'} />
        </div>
      </div>

      {/* ── Alterar senha ───────────────────────────────────────────── */}
      <div className="profile-card" style={{ maxWidth: 420 }}>
        <div className="profile-card-title">Alterar senha</div>
        <AlertMessage message={passFeedback.msg} type={passFeedback.type} />
        <form onSubmit={handlePassSubmit}>
          <div className="field">
            <label htmlFor="senhaAtual">Senha atual</label>
            <input
              id="senhaAtual" name="senhaAtual" type="password"
              value={passForm.senhaAtual} onChange={handlePassChange}
              disabled={passSaving} required
            />
          </div>
          <div className="field">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha" name="novaSenha" type="password"
              value={passForm.novaSenha} onChange={handlePassChange}
              disabled={passSaving} required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmarNovaSenha">Confirmar nova senha</label>
            <input
              id="confirmarNovaSenha" name="confirmarNovaSenha" type="password"
              value={passForm.confirmarNovaSenha} onChange={handlePassChange}
              disabled={passSaving} required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={passSaving}>
            {passSaving ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PerfilTab;
