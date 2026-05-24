import { useEffect, useState, useCallback } from 'react';
import { getAllUsers, registerUser, updateUserEmail, deactivateUser } from '../../../services/api';
import Modal from '../../ui/Modal';
import AlertMessage from '../../ui/AlertMessage';

const RecepcionistasTab = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [pageError, setPageError]         = useState('');

  const [createModal, setCreateModal]     = useState(false);
  const [editModal, setEditModal]         = useState(false);
  const [confirmModal, setConfirmModal]   = useState(false);
  const [passModal, setPassModal]         = useState(false);

  const [selected, setSelected]           = useState(null);
  const [createForm, setCreateForm]       = useState({ nome: '', email: '' });
  const [editEmail, setEditEmail]         = useState('');
  const [formError, setFormError]         = useState('');
  const [tempPassword, setTempPassword]   = useState('');
  const [copied, setCopied]               = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const all = await getAllUsers();
      setReceptionists(
        (all ?? []).filter((u) => u.role?.toLowerCase() === 'receptionist'),
      );
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handlers ─────────────────────────────────────────

  const openCreate = () => {
    setCreateForm({ nome: '', email: '' });
    setFormError('');
    setCreateModal(true);
  };

  const openEdit = (rec) => {
    setSelected(rec);
    setEditEmail(rec.email);
    setFormError('');
    setEditModal(true);
  };

  const openConfirm = (rec) => {
    setSelected(rec);
    setConfirmModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const { senha } = await registerUser({ ...createForm, role: 'receptionist' });
      setTempPassword(senha);
      setCreateModal(false);
      setPassModal(true);
      await fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await updateUserEmail(selected.id, editEmail);
      setEditModal(false);
      await fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deactivateUser(selected.id);
      setConfirmModal(false);
      setSelected(null);
      await fetchData();
    } catch (err) {
      setPageError(err.message);
      setConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Render ────────────────────────────────────────────

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  const active   = receptionists.filter((r) => r.isActive);
  const inactive = receptionists.filter((r) => !r.isActive);

  return (
    <div>
      <AlertMessage message={pageError} type="error" />

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {active.length} ativo{active.length !== 1 ? 's' : ''}
            {inactive.length > 0 && ` · ${inactive.length} inativo${inactive.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <button className="btn-primary btn-sm" style={{ width: 'auto' }} onClick={openCreate}>
          + Nova recepcionista
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Primeiro acesso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {receptionists.length === 0 ? (
              <tr><td colSpan={5} className="state-box">Nenhuma recepcionista cadastrada.</td></tr>
            ) : (
              receptionists.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.nome}</td>
                  <td className="td-muted">{r.email}</td>
                  <td>
                    <span className={`badge ${r.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {r.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    {r.mustChangePassword
                      ? <span className="badge badge-inactive">Pendente</span>
                      : <span className="badge badge-active">Realizado</span>
                    }
                  </td>
                  <td>
                    {r.isActive && (
                      <div className="action-group">
                        <button className="btn-sm btn-outline" onClick={() => openEdit(r)}>
                          Editar e-mail
                        </button>
                        <button className="btn-sm btn-danger-outline" onClick={() => openConfirm(r)}>
                          Desativar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: criar recepcionista ─────────────────── */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nova recepcionista">
        <AlertMessage message={formError} type="error" />
        <form onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="r-nome">Nome completo</label>
            <input id="r-nome" value={createForm.nome} required disabled={saving}
              onChange={(e) => setCreateForm((p) => ({ ...p, nome: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="r-email">E-mail</label>
            <input id="r-email" type="email" value={createForm.email} required disabled={saving}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline"
              onClick={() => setCreateModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary btn-sm" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: editar e-mail ────────────────────────── */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar e-mail">
        <AlertMessage message={formError} type="error" />
        <p className="confirm-sub" style={{ marginBottom: 12 }}>
          Editando: <strong>{selected?.nome}</strong>
        </p>
        <form onSubmit={handleEdit}>
          <div className="field">
            <label htmlFor="r-edit-email">Novo e-mail</label>
            <input id="r-edit-email" type="email" value={editEmail} required disabled={saving}
              onChange={(e) => setEditEmail(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline"
              onClick={() => setEditModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary btn-sm" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: confirmação ─────────────────────────── */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="Desativar recepcionista">
        <p className="confirm-text">
          Deseja desativar <strong>{selected?.nome}</strong>?
        </p>
        <p className="confirm-sub" style={{ marginTop: 4 }}>
          O acesso ao sistema será revogado imediatamente.
        </p>
        <div className="modal-footer">
          <button className="btn-sm btn-outline" onClick={() => setConfirmModal(false)} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-sm btn-danger-outline" onClick={handleDelete} disabled={saving}>
            {saving ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </Modal>

      {/* ── Modal: senha temporária ─────────────────────── */}
      <Modal isOpen={passModal} onClose={() => setPassModal(false)} title="Recepcionista cadastrada">
        <p className="confirm-text" style={{ marginBottom: 12 }}>
          Cadastro realizado. Repasse a senha temporária abaixo para a recepcionista.
        </p>
        <div className="password-reveal">{tempPassword}</div>
        <p className="password-hint">A senha deverá ser trocada no primeiro acesso.</p>
        <div className="modal-footer">
          <button className="btn-sm btn-outline" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar senha'}
          </button>
          <button className="btn-primary btn-sm" style={{ width: 'auto' }}
            onClick={() => setPassModal(false)}>
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default RecepcionistasTab;
