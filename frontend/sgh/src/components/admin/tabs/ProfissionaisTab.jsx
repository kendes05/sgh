import { useEffect, useState, useCallback } from 'react';
import {
  getAllDoctors,
  getAllUsers,
  createProfissional,
  updateDoctor,
  deleteProfissional,
} from '../../../services/api';
import Modal from '../../ui/Modal';
import AlertMessage from '../../ui/AlertMessage';

const ROLE_OPTIONS  = [{ value: 'medic', label: 'Médico' }, { value: 'nurse', label: 'Enfermeiro' }];
const SEXO_OPTIONS  = [{ value: 'MASCULINO', label: 'Masculino' }, { value: 'FEMININO', label: 'Feminino' }, { value: 'OUTRO', label: 'Outro' }];
const ROLE_LABELS   = { medic: 'Médico', nurse: 'Enfermeiro' };
const FILTER_OPTIONS = [{ value: 'all', label: 'Todos' }, { value: 'medic', label: 'Médicos' }, { value: 'nurse', label: 'Enfermeiros' }];

const EMPTY_FORM = {
  nome: '', email: '', role: 'medic', sexo: 'MASCULINO',
  crmCoren: '', especialidadePrincipal: '', telefone: '',
};

const ProfissionaisTab = () => {
  const [doctors, setDoctors]           = useState([]);
  const [allUsers, setAllUsers]         = useState([]);
  const [filter, setFilter]             = useState('all');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [pageError, setPageError]       = useState('');

  // Modal states
  const [formModal, setFormModal]       = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [passModal, setPassModal]       = useState(false);

  const [editingDoctor, setEditingDoctor] = useState(null); // null = create mode
  const [targetDoctor, setTargetDoctor]   = useState(null); // for deletion
  const [formData, setFormData]           = useState(EMPTY_FORM);
  const [formError, setFormError]         = useState('');
  const [tempPassword, setTempPassword]   = useState('');
  const [copied, setCopied]              = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [docs, users] = await Promise.all([getAllDoctors(), getAllUsers()]);
      setDoctors(docs ?? []);
      setAllUsers(users ?? []);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = doctors.filter((d) => {
    if (filter === 'all') return true;
    return d.role?.toLowerCase() === filter;
  });

  // ── Handlers ─────────────────────────────────────────

  const openCreate = () => {
    setEditingDoctor(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setFormModal(true);
  };

  const openEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      nome:                  doctor.nome ?? '',
      email:                 doctor.email ?? '',
      role:                  doctor.role?.toLowerCase() ?? 'medic',
      sexo:                  doctor.sexo ?? 'MASCULINO',
      crmCoren:              doctor.crmCoren ?? '',
      especialidadePrincipal: doctor.especialidadePrincipal ?? '',
      telefone:              doctor.telefone ?? '',
    });
    setFormError('');
    setFormModal(true);
  };

  const openConfirm = (doctor) => {
    setTargetDoctor(doctor);
    setConfirmModal(true);
  };

  const handleFormChange = ({ target: { name, value } }) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingDoctor) {
        // Edição — não permite alterar e-mail para evitar dessincronização
        const payload = {
          nome:                  formData.nome,
          email:                 editingDoctor.email, // preserva e-mail original
          role:                  formData.role,
          sexo:                  formData.sexo,
          crmCoren:              formData.crmCoren,
          especialidadePrincipal: formData.especialidadePrincipal,
          telefone:              formData.telefone,
        };
        await updateDoctor(editingDoctor.id, payload);
        setFormModal(false);
        await fetchData();
      } else {
        console.log('Submitting new professional with data:', formData);
        await createProfissional(formData);
        setFormModal(false);
        await fetchData();
        // Exibe a senha temporária apenas se o backend a retornar
        if (senha) {
          setTempPassword(senha);
          setPassModal(true);
        }
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetDoctor) return;
    setSaving(true);
    try {
      await deleteProfissional(targetDoctor, allUsers);
      setConfirmModal(false);
      setTargetDoctor(null);
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

  return (
    <div>
      <AlertMessage message={pageError} type="error" />

      <div className="toolbar">
        <div className="toolbar-left">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`chip${filter === opt.value ? ' active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button className="btn-primary btn-sm" style={{ width: 'auto' }} onClick={openCreate}>
          + Novo profissional
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>CRM / COREN</th>
              <th>Especialidade</th>
              <th>Telefone</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="state-box">Nenhum profissional encontrado.</td></tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{d.nome}</div>
                    <div className="td-muted">{d.email}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${d.role?.toLowerCase()}`}>
                      {ROLE_LABELS[d.role?.toLowerCase()] ?? d.role}
                    </span>
                  </td>
                  <td className="td-muted">{d.crmCoren}</td>
                  <td className="td-muted">{d.especialidadePrincipal}</td>
                  <td className="td-muted">{d.telefone}</td>
                  <td>
                    <span className={`badge ${d.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {d.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="btn-sm btn-outline" onClick={() => openEdit(d)}>
                        Editar
                      </button>
                      {d.isActive && (
                        <button className="btn-sm btn-danger-outline" onClick={() => openConfirm(d)}>
                          Desativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: criar / editar ──────────────────────── */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editingDoctor ? 'Editar profissional' : 'Novo profissional'}
      >
        <AlertMessage message={formError} type="error" />
        <form onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="p-nome">Nome completo</label>
              <input id="p-nome" name="nome" value={formData.nome}
                onChange={handleFormChange} required disabled={saving} />
            </div>
            <div className="field">
              <label htmlFor="p-email">E-mail</label>
              <input id="p-email" name="email" type="email" value={formData.email}
                onChange={handleFormChange} required disabled={saving || !!editingDoctor}
                title={editingDoctor ? 'E-mail não pode ser alterado após o cadastro' : ''} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="p-role">Cargo</label>
              <select id="p-role" name="role" value={formData.role}
                onChange={handleFormChange} disabled={saving}>
                {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-sexo">Sexo</label>
              <select id="p-sexo" name="sexo" value={formData.sexo}
                onChange={handleFormChange} disabled={saving}>
                {SEXO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="p-crm">CRM / COREN</label>
              <input id="p-crm" name="crmCoren" value={formData.crmCoren}
                onChange={handleFormChange} maxLength={20} required disabled={saving}
                placeholder="Ex: CRM-CE 12345" />
            </div>
            <div className="field">
              <label htmlFor="p-telefone">Telefone</label>
              <input id="p-telefone" name="telefone" value={formData.telefone}
                onChange={handleFormChange} required disabled={saving}
                placeholder="(85) 99999-9999" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-especialidade">Especialidade principal</label>
            <input id="p-especialidade" name="especialidadePrincipal" value={formData.especialidadePrincipal}
              onChange={handleFormChange} maxLength={100} required disabled={saving}
              placeholder="Ex: Cardiologia" />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline"
              onClick={() => setFormModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary btn-sm" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Salvando...' : editingDoctor ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: confirmação de exclusão ────────────── */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="Desativar profissional">
        <p className="confirm-text">
          Deseja desativar <strong>{targetDoctor?.nome}</strong>?
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

      {/* ── Modal: senha temporária ────────────────────── */}
      <Modal isOpen={passModal} onClose={() => setPassModal(false)} title="Profissional cadastrado">
        <p className="confirm-text" style={{ marginBottom: 12 }}>
          Profissional criado com sucesso. Anote a senha temporária abaixo e repasse ao colaborador.
        </p>
        <div className="password-reveal">{tempPassword}</div>
        <p className="password-hint">
          O profissional deverá trocar esta senha no primeiro acesso.
        </p>
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

export default ProfissionaisTab;
