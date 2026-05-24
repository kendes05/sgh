import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getAllPatients,
  getPatientStats,
  searchPatientByEmail,
  searchPatientByCpf,
  createPatient,
  updatePatient,
  deletePatient,
} from '../../../services/api';
import Modal from '../../ui/Modal';
import AlertMessage from '../../ui/AlertMessage';

// ─── Constantes de domínio ─────────────────────────────────────────────────────

const GENERO_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO',  label: 'Feminino'  },
  { value: 'OUTRO',     label: 'Outro'     },
];

const TIPO_SANGUINEO_OPTIONS = [
  { value: 'A_POS',       label: 'A+'          },
  { value: 'A_NEG',       label: 'A-'          },
  { value: 'B_POS',       label: 'B+'          },
  { value: 'B_NEG',       label: 'B-'          },
  { value: 'AB_POS',      label: 'AB+'         },
  { value: 'AB_NEG',      label: 'AB-'         },
  { value: 'O_POS',       label: 'O+'          },
  { value: 'O_NEG',       label: 'O-'          },
  { value: 'DESCONHECIDO',label: 'Desconhecido'},
];

const TIPO_LABEL = Object.fromEntries(TIPO_SANGUINEO_OPTIONS.map((o) => [o.value, o.label]));

const EMPTY_FORM = {
  nome: '', email: '', cpf: '', telefone: '',
  genero: 'MASCULINO', tipoSanguineo: 'DESCONHECIDO',
  susCardNumber: '', dataNascimento: '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const formatCpf = (cpf = '') => {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

const looksLikeEmail = (s) => s.includes('@');
const looksLikeCpf   = (s) => s.replace(/\D/g, '').length === 11;

// ─── Componente ────────────────────────────────────────────────────────────────

const PacientesTab = () => {
  const [allPatients, setAllPatients]     = useState([]);
  const [displayed, setDisplayed]         = useState([]);
  const [stats, setStats]                 = useState(null);
  const [search, setSearch]               = useState('');
  const [searching, setSearching]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [pageError, setPageError]         = useState('');

  const [formModal, setFormModal]         = useState(false);
  const [confirmModal, setConfirmModal]   = useState(false);

  const [editingPatient, setEditingPatient] = useState(null);
  const [targetPatient, setTargetPatient]   = useState(null);
  const [formData, setFormData]             = useState(EMPTY_FORM);
  const [formError, setFormError]           = useState('');

  const debounceRef = useRef(null);

  // ── Fetch inicial ─────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [patients, s] = await Promise.all([getAllPatients(), getPatientStats()]);
      setAllPatients(patients ?? []);
      setDisplayed(patients ?? []);
      setStats(s);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Busca ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!search.trim()) {
      setDisplayed(allPatients);
      return;
    }

    if (looksLikeEmail(search) || looksLikeCpf(search)) {
      // Busca no backend via e-mail ou CPF (debounce 500ms)
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const result = looksLikeEmail(search)
            ? await searchPatientByEmail(search.trim())
            : await searchPatientByCpf(search.trim().replace(/\D/g, ''));
          setDisplayed(Array.isArray(result) ? result : [result]);
        } catch {
          setDisplayed([]);
        } finally {
          setSearching(false);
        }
      }, 500);
    } else {
      // Filtro local por nome
      const term = search.toLowerCase();
      setDisplayed(allPatients.filter((p) => p.nome?.toLowerCase().includes(term)));
    }
  }, [search, allPatients]);

  // ── Handlers de formulário ─────────────────────────────────────────────────

  const openCreate = () => {
    setEditingPatient(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setFormModal(true);
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      nome:           patient.nome          ?? '',
      email:          patient.email         ?? '',
      cpf:            patient.cpf           ?? '',
      telefone:       patient.telefone      ?? '',
      genero:         patient.genero        ?? 'MASCULINO',
      tipoSanguineo:  patient.tipoSanguineo ?? 'DESCONHECIDO',
      susCardNumber:  patient.susCardNumber ?? '',
      dataNascimento: patient.dataNascimento ?? '',
    });
    setFormError('');
    setFormModal(true);
  };

  const openConfirm = (patient) => {
    setTargetPatient(patient);
    setConfirmModal(true);
  };

  const handleChange = ({ target: { name, value } }) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, {
          nome:           formData.nome           || undefined,
          email:          formData.email          || undefined,
          cpf:            formData.cpf            || undefined,
          telefone:       formData.telefone       || undefined,
          genero:         formData.genero         || undefined,
          tipoSanguineo:  formData.tipoSanguineo  || undefined,
          susCardNumber:  formData.susCardNumber  || undefined,
          dataNascimento: formData.dataNascimento || undefined,
        });
      } else {
        await createPatient({
          nome:           formData.nome,
          email:          formData.email,
          cpf:            formData.cpf,
          telefone:       formData.telefone,
          genero:         formData.genero,
          tipoSanguineo:  formData.tipoSanguineo,
          susCardNumber:  formData.susCardNumber  || undefined,
          dataNascimento: formData.dataNascimento,
        });
      }
      setFormModal(false);
      setSearch('');
      await fetchAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetPatient) return;
    setSaving(true);
    try {
      await deletePatient(targetPatient.id);
      setConfirmModal(false);
      setTargetPatient(null);
      setSearch('');
      await fetchAll();
    } catch (err) {
      setPageError(err.message);
      setConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <AlertMessage message={pageError} type="error" />

      {/* ── Stats ──────────────────────────────────────────── */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-label">Pacientes ativos</div>
            <div className="stat-value">{stats.totalAtivos ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cadastrados este mês</div>
            <div className="stat-value">{stats.cadastrosNoMes ?? 0}</div>
          </div>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-left" style={{ flex: 1 }}>
          <div className="search-wrap">
            <input
              className="search-input"
              type="text"
              placeholder="Buscar por nome, e-mail ou CPF…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searching && <span className="search-spinner" />}
          </div>
        </div>
        <button
          className="btn-primary btn-sm"
          style={{ width: 'auto', flexShrink: 0 }}
          onClick={openCreate}
        >
          + Novo paciente
        </button>
      </div>

      {/* ── Tabela ─────────────────────────────────────────── */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CPF</th>
              <th>Nascimento</th>
              <th>Telefone</th>
              <th>Tipo sanguíneo</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="state-box">
                  {search ? 'Nenhum paciente encontrado para esta busca.' : 'Nenhum paciente cadastrado.'}
                </td>
              </tr>
            ) : (
              displayed.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.nome}</div>
                    <div className="td-muted">{p.email}</div>
                  </td>
                  <td className="td-muted">{formatCpf(p.cpf)}</td>
                  <td className="td-muted">{formatDate(p.dataNascimento)}</td>
                  <td className="td-muted">{p.telefone}</td>
                  <td className="td-muted">{TIPO_LABEL[p.tipoSanguineo] ?? p.tipoSanguineo}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {p.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    {p.isActive && (
                      <div className="action-group">
                        <button className="btn-sm btn-outline" onClick={() => openEdit(p)}>
                          Editar
                        </button>
                        <button className="btn-sm btn-danger-outline" onClick={() => openConfirm(p)}>
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

      {/* ── Modal: criar / editar ───────────────────────────── */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editingPatient ? 'Editar paciente' : 'Novo paciente'}
      >
        <AlertMessage message={formError} type="error" />
        <form onSubmit={handleSubmit}>

          <div className="form-row">
            <div className="field">
              <label htmlFor="pac-nome">Nome completo</label>
              <input id="pac-nome" name="nome" value={formData.nome}
                onChange={handleChange} required={!editingPatient} disabled={saving} />
            </div>
            <div className="field">
              <label htmlFor="pac-email">E-mail</label>
              <input id="pac-email" name="email" type="email" value={formData.email}
                onChange={handleChange} required={!editingPatient} disabled={saving} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="pac-cpf">CPF</label>
              <input id="pac-cpf" name="cpf" value={formData.cpf}
                onChange={handleChange} required={!editingPatient} disabled={saving}
                placeholder="000.000.000-00" />
            </div>
            <div className="field">
              <label htmlFor="pac-nasc">Data de nascimento</label>
              <input id="pac-nasc" name="dataNascimento" type="date" value={formData.dataNascimento}
                onChange={handleChange} required={!editingPatient} disabled={saving} />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="pac-tel">Telefone</label>
              <input id="pac-tel" name="telefone" value={formData.telefone}
                onChange={handleChange} required={!editingPatient} disabled={saving}
                placeholder="(85) 99999-9999" />
            </div>
            <div className="field">
              <label htmlFor="pac-genero">Gênero</label>
              <select id="pac-genero" name="genero" value={formData.genero}
                onChange={handleChange} disabled={saving}>
                {GENERO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="pac-tipo">Tipo sanguíneo</label>
              <select id="pac-tipo" name="tipoSanguineo" value={formData.tipoSanguineo}
                onChange={handleChange} disabled={saving}>
                {TIPO_SANGUINEO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pac-sus">N° Cartão SUS <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span></label>
              <input id="pac-sus" name="susCardNumber" value={formData.susCardNumber}
                onChange={handleChange} disabled={saving} maxLength={30}
                placeholder="000 0000 0000 0000" />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline"
              onClick={() => setFormModal(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary btn-sm"
              style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Salvando...' : editingPatient ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: confirmação de desativação ────────────────── */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="Desativar paciente">
        <p className="confirm-text">
          Deseja desativar <strong>{targetPatient?.nome}</strong>?
        </p>
        <p className="confirm-sub" style={{ marginTop: 4 }}>
          O paciente não aparecerá mais nas listagens ativas do sistema.
        </p>
        <div className="modal-footer">
          <button className="btn-sm btn-outline"
            onClick={() => setConfirmModal(false)} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-sm btn-danger-outline"
            onClick={handleDelete} disabled={saving}>
            {saving ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PacientesTab;
