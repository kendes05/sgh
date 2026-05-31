import { useState, useEffect, useCallback } from 'react';
import AlertMessage from '../../ui/AlertMessage';
import Modal from '../../ui/Modal';
import {
  getAllPatients,
  getScreenings,
  createScreening,
  getClassificationSuggestion,
  validateClassification,
  routeScreening,
} from '../../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const SYMPTOM_LABELS = {
  TOSSE: 'Tosse',
  FALTA_DE_AR: 'Falta de ar',
  CHIADO_NO_PEITO: 'Chiado no peito',
  DOR_AO_RESPIRAR: 'Dor ao respirar',
  DOR_NO_PEITO: 'Dor no peito',
  PALPITACOES: 'Palpitações',
  INCHACO_NAS_PERNAS: 'Inchaço nas pernas',
  NAUSEA: 'Náusea',
  VOMITO: 'Vômito',
  VOMITO_PERSISTENTE: 'Vômito persistente',
  DIARREIA: 'Diarreia',
  DOR_ABDOMINAL: 'Dor abdominal',
  TONTURA: 'Tontura',
  CEFALEIA: 'Cefaleia',
  ALTERACAO_VISUAL: 'Alteração visual',
  FRAQUEZA_EM_MEMBROS: 'Fraqueza em membros',
  TRAUMA: 'Trauma',
  HEMORRAGIA_ATIVA: 'Hemorragia ativa',
  CONVULSAO: 'Convulsão',
  SINAIS_DESIDRATACAO: 'Sinais de desidratação',
  FERIMENTO_COM_CORTE: 'Ferimento com corte',
};

const PRIORITY_COLORS = {
  VERMELHO: '#dc2626',
  LARANJA: '#ea580c',
  AMARELO: '#ca8a04',
  VERDE: '#16a34a',
  AZUL: '#2563eb',
};

const PRIORITY_LABELS = {
  VERMELHO: 'Vermelho — Emergência',
  LARANJA: 'Laranja — Muito urgente',
  AMARELO: 'Amarelo — Urgente',
  VERDE: 'Verde — Pouco urgente',
  AZUL: 'Azul — Não urgente',
};

const SECTOR_LABELS = {
  SALA_EMERGENCIA: 'Sala de Emergência',
  CONSULTORIO_CLINICA_GERAL: 'Consultório — Clínica Geral',
  CONSULTORIO_PEDIATRICO: 'Consultório Pediátrico',
  CONSULTORIO_ORTOPEDICO: 'Consultório Ortopédico',
  SALA_MEDICACAO: 'Sala de Medicação',
  OBSERVACAO: 'Observação',
  SALA_SUTURAS: 'Sala de Suturas',
};

const STATUS_LABELS = {
  AGUARDANDO_CLASSIFICACAO: 'Aguardando classificação',
  CLASSIFICADA: 'Classificada',
  AGUARDANDO_ATENDIMENTO: 'Aguardando atendimento',
  EM_ATENDIMENTO: 'Em atendimento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
  AUSENTE: 'Ausente',
};

const ACTIVE_STATUSES = new Set([
  'AGUARDANDO_CLASSIFICACAO',
  'CLASSIFICADA',
  'AGUARDANDO_ATENDIMENTO',
  'EM_ATENDIMENTO',
]);

const BLANK_VITALS = {
  pressaoSistolica: '',
  pressaoDiastolica: '',
  frequenciaCardiaca: '',
  temperatura: '',
  frequenciaRespiratoria: '',
  saturacaoOxigenio: '',
  glicemia: '',
  escalaDor: '',
};

const BLANK_FORM = {
  mainComplaint: '',
  symptoms: [],
  complementarySymptoms: '',
  allergies: [],
  medicationsInUse: [],
  comorbidities: [],
  generalNotes: '',
  vitalSigns: { ...BLANK_VITALS },
};

// ─── Tag list input ───────────────────────────────────────────────────────────

const TagInput = ({ label, items, onChange, disabled }) => {
  const [val, setVal] = useState('');
  const add = () => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setVal('');
  };
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Digite e pressione Enter ou +"
          disabled={disabled}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn-sm btn-outline" onClick={add} disabled={disabled}>+</button>
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {items.map((item) => (
            <span
              key={item}
              style={{
                background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4,
                padding: '2px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                disabled={disabled}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0 2px', fontSize: 14, lineHeight: 1 }}
              >×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Priority badge ───────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
  if (!priority) return <span className="td-muted">—</span>;
  const color = PRIORITY_COLORS[priority] || '#6b7280';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: color + '1a', color, border: `1px solid ${color}40`,
    }}>
      {priority}
    </span>
  );
};

// ─── Textarea style ───────────────────────────────────────────────────────────

const taStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 8, font: 'inherit', resize: 'vertical',
};

// ─── Main component ───────────────────────────────────────────────────────────

const TriagemTab = ({ nurseId }) => {
  const [patients, setPatients] = useState([]);
  const [screeningMap, setScreeningMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // step: null | 'form' | 'classificacao' | 'encaminhamento'
  const [step, setStep] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeScreening, setActiveScreening] = useState(null);

  const [form, setForm] = useState(BLANK_FORM);
  const [suggestion, setSuggestion] = useState(null);
  const [classForm, setClassForm] = useState({ finalPriority: '', overrideJustification: '' });
  const [routeForm, setRouteForm] = useState({ destinationSector: '', routingNotes: '' });

  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  // ─── Load patients + active screenings ──────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pList, sList] = await Promise.all([getAllPatients(), getScreenings()]);
      setPatients(pList.filter((p) => p.isActive));
      const map = {};
      for (const s of sList) {
        if (ACTIVE_STATUSES.has(s.status)) {
          if (!map[s.patientId] || new Date(s.createdAt) > new Date(map[s.patientId].createdAt)) {
            map[s.patientId] = s;
          }
        }
      }
      setScreeningMap(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Helpers ─────────────────────────────────────────────────────

  const calcAge = (dob) => {
    if (!dob) return '—';
    const d = new Date(dob);
    const t = new Date();
    let age = t.getFullYear() - d.getFullYear();
    if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age--;
    return `${age} a`;
  };

  const filtered = patients.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const closeModal = () => { setStep(null); setModalError(''); setSuggestion(null); };

  const setVS = (field, val) =>
    setForm((p) => ({ ...p, vitalSigns: { ...p.vitalSigns, [field]: val } }));

  const toggleSymptom = (s) =>
    setForm((p) => ({
      ...p,
      symptoms: p.symptoms.includes(s)
        ? p.symptoms.filter((x) => x !== s)
        : [...p.symptoms, s],
    }));

  // ─── Open modals ──────────────────────────────────────────────────

  const openForm = (patient) => {
    setSelectedPatient(patient);
    setForm(BLANK_FORM);
    setModalError('');
    setStep('form');
  };

  const openClassificacao = async (patient, screening) => {
    setSelectedPatient(patient);
    setActiveScreening(screening);
    setClassForm({ finalPriority: screening.suggestedPriority || '', overrideJustification: '' });
    setModalError('');
    setSuggestion(null);
    setStep('classificacao');
    try {
      const sugg = await getClassificationSuggestion(screening.id);
      setSuggestion(sugg);
      setClassForm((p) => ({ ...p, finalPriority: p.finalPriority || sugg.suggestedPriority }));
    } catch { /* sugestão é opcional */ }
  };

  const openEncaminhamento = (patient, screening) => {
    setSelectedPatient(patient);
    setActiveScreening(screening);
    setRouteForm({ destinationSector: '', routingNotes: '' });
    setModalError('');
    setStep('encaminhamento');
  };

  // ─── Submits ──────────────────────────────────────────────────────

  const submitForm = async (e) => {
    e.preventDefault();
    const vs = form.vitalSigns;
    if (!form.mainComplaint.trim()) { setModalError('Queixa principal é obrigatória.'); return; }
    if (!vs.pressaoSistolica || !vs.pressaoDiastolica || !vs.frequenciaCardiaca ||
        !vs.temperatura || !vs.frequenciaRespiratoria || !vs.saturacaoOxigenio || vs.escalaDor === '') {
      setModalError('Preencha todos os sinais vitais obrigatórios.'); return;
    }

    setBusy(true);
    setModalError('');
    try {
      const screening = await createScreening({
        patientId: selectedPatient.id,
        patientName: selectedPatient.nome,
        patientBirthDate: selectedPatient.dataNascimento,
        susCardNumber: selectedPatient.susCardNumber || null,
        triageProfessionalId: nurseId,
        mainComplaint: form.mainComplaint.trim(),
        symptoms: form.symptoms,
        complementarySymptoms: form.complementarySymptoms || null,
        allergies: form.allergies,
        medicationsInUse: form.medicationsInUse,
        comorbidities: form.comorbidities,
        generalNotes: form.generalNotes || null,
        vitalSigns: {
          pressaoSistolica: Number(vs.pressaoSistolica),
          pressaoDiastolica: Number(vs.pressaoDiastolica),
          frequenciaCardiaca: Number(vs.frequenciaCardiaca),
          temperatura: parseFloat(vs.temperatura),
          frequenciaRespiratoria: Number(vs.frequenciaRespiratoria),
          saturacaoOxigenio: Number(vs.saturacaoOxigenio),
          glicemia: vs.glicemia ? Number(vs.glicemia) : null,
          escalaDor: Number(vs.escalaDor),
        },
      });

      setActiveScreening(screening);
      setClassForm({ finalPriority: '', overrideJustification: '' });
      setSuggestion(null);
      setStep('classificacao');
      try {
        const sugg = await getClassificationSuggestion(screening.id);
        setSuggestion(sugg);
        setClassForm((p) => ({ ...p, finalPriority: sugg.suggestedPriority }));
      } catch { /* sugestão é opcional */ }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitClassificacao = async (e) => {
    e.preventDefault();
    if (!classForm.finalPriority) { setModalError('Selecione a prioridade.'); return; }
    if (suggestion && classForm.finalPriority !== suggestion.suggestedPriority && !classForm.overrideJustification.trim()) {
      setModalError('Justifique a alteração em relação à sugestão.'); return;
    }
    setBusy(true);
    setModalError('');
    try {
      const updated = await validateClassification(activeScreening.id, {
        professionalId: nurseId,
        finalPriority: classForm.finalPriority,
        overrideJustification: classForm.overrideJustification || null,
      });
      setActiveScreening(updated);
      setRouteForm({ destinationSector: '', routingNotes: '' });
      setModalError('');
      setStep('encaminhamento');
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitEncaminhamento = async (e) => {
    e.preventDefault();
    setBusy(true);
    setModalError('');
    try {
      await routeScreening(activeScreening.id, {
        professionalId: nurseId,
        destinationSector: routeForm.destinationSector || null,
        routingNotes: routeForm.routingNotes || null,
      });
      closeModal();
      loadData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Triagem</div>
          <div className="section-subtitle">Registre e classifique pacientes na fila de atendimento</div>
        </div>
        <button className="btn-sm btn-outline" onClick={loadData}>Atualizar</button>
      </div>

      {error && <AlertMessage message={error} type="error" />}

      <div className="toolbar">
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CPF</th>
              <th>Idade</th>
              <th>Status triagem</th>
              <th>Prioridade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}><div className="state-box">Nenhum paciente encontrado.</div></td>
              </tr>
            ) : filtered.map((patient) => {
              const sc = screeningMap[patient.id];
              const status = sc?.status;
              const priority = sc?.finalPriority || sc?.suggestedPriority;

              const statusBadge = {
                AGUARDANDO_CLASSIFICACAO: 'badge-receptionist',
                CLASSIFICADA: 'badge-medic',
                AGUARDANDO_ATENDIMENTO: 'badge-nurse',
                EM_ATENDIMENTO: 'badge-active',
              }[status] || 'badge-inactive';

              return (
                <tr key={patient.id}>
                  <td><strong>{patient.nome}</strong></td>
                  <td className="td-muted">{patient.cpf}</td>
                  <td className="td-muted">{calcAge(patient.dataNascimento)}</td>
                  <td>
                    {status
                      ? <span className={`badge ${statusBadge}`}>{STATUS_LABELS[status] || status}</span>
                      : <span className="td-muted">—</span>
                    }
                  </td>
                  <td><PriorityBadge priority={priority} /></td>
                  <td>
                    <div className="action-group">
                      {!status && (
                        <button className="btn-sm btn-outline" onClick={() => openForm(patient)}>
                          Iniciar triagem
                        </button>
                      )}
                      {status === 'AGUARDANDO_CLASSIFICACAO' && (
                        <button className="btn-sm btn-outline" onClick={() => openClassificacao(patient, sc)}>
                          Classificar
                        </button>
                      )}
                      {status === 'CLASSIFICADA' && (
                        <button className="btn-sm btn-outline" onClick={() => openEncaminhamento(patient, sc)}>
                          Encaminhar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Triage form modal ──────────────────────────────────────── */}
      <Modal
        isOpen={step === 'form'}
        onClose={closeModal}
        title={`Nova triagem — ${selectedPatient?.nome}`}
        maxWidth="560px"
      >
        <form onSubmit={submitForm}>
          <AlertMessage message={modalError} type="error" />

          <div className="field">
            <label>Queixa principal *</label>
            <textarea
              rows={3}
              value={form.mainComplaint}
              onChange={(e) => setForm((p) => ({ ...p, mainComplaint: e.target.value }))}
              style={taStyle}
              disabled={busy}
              required
            />
          </div>

          <div className="field">
            <label>Sintomas</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 400, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.symptoms.includes(key)}
                    onChange={() => toggleSymptom(key)}
                    disabled={busy}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Sintomas complementares</label>
            <textarea
              rows={2}
              value={form.complementarySymptoms}
              onChange={(e) => setForm((p) => ({ ...p, complementarySymptoms: e.target.value }))}
              style={taStyle}
              disabled={busy}
            />
          </div>

          <TagInput label="Alergias" items={form.allergies} onChange={(v) => setForm((p) => ({ ...p, allergies: v }))} disabled={busy} />
          <TagInput label="Medicamentos em uso" items={form.medicationsInUse} onChange={(v) => setForm((p) => ({ ...p, medicationsInUse: v }))} disabled={busy} />
          <TagInput label="Comorbidades" items={form.comorbidities} onChange={(v) => setForm((p) => ({ ...p, comorbidities: v }))} disabled={busy} />

          <div className="field">
            <label>Observações gerais</label>
            <textarea
              rows={2}
              value={form.generalNotes}
              onChange={(e) => setForm((p) => ({ ...p, generalNotes: e.target.value }))}
              style={taStyle}
              disabled={busy}
            />
          </div>

          {/* Vital signs */}
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              Sinais vitais *
            </div>
            <div className="form-row">
              <div className="field">
                <label>PA sistólica (mmHg)</label>
                <input type="number" min={30} max={300} value={form.vitalSigns.pressaoSistolica} onChange={(e) => setVS('pressaoSistolica', e.target.value)} required disabled={busy} />
              </div>
              <div className="field">
                <label>PA diastólica (mmHg)</label>
                <input type="number" min={20} max={200} value={form.vitalSigns.pressaoDiastolica} onChange={(e) => setVS('pressaoDiastolica', e.target.value)} required disabled={busy} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Freq. cardíaca (bpm)</label>
                <input type="number" min={20} max={250} value={form.vitalSigns.frequenciaCardiaca} onChange={(e) => setVS('frequenciaCardiaca', e.target.value)} required disabled={busy} />
              </div>
              <div className="field">
                <label>Freq. respiratória (irpm)</label>
                <input type="number" min={5} max={80} value={form.vitalSigns.frequenciaRespiratoria} onChange={(e) => setVS('frequenciaRespiratoria', e.target.value)} required disabled={busy} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Temperatura (°C)</label>
                <input type="number" step="0.1" min={25} max={45} value={form.vitalSigns.temperatura} onChange={(e) => setVS('temperatura', e.target.value)} required disabled={busy} />
              </div>
              <div className="field">
                <label>Saturação O₂ (%)</label>
                <input type="number" min={50} max={100} value={form.vitalSigns.saturacaoOxigenio} onChange={(e) => setVS('saturacaoOxigenio', e.target.value)} required disabled={busy} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Glicemia (mg/dL)</label>
                <input type="number" min={20} max={600} value={form.vitalSigns.glicemia} onChange={(e) => setVS('glicemia', e.target.value)} disabled={busy} />
              </div>
              <div className="field">
                <label>Escala de dor (0–10) *</label>
                <input type="number" min={0} max={10} value={form.vitalSigns.escalaDor} onChange={(e) => setVS('escalaDor', e.target.value)} required disabled={busy} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeModal} disabled={busy}>Cancelar</button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={busy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {busy ? 'Salvando...' : 'Registrar e classificar →'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Classification modal ───────────────────────────────────── */}
      <Modal isOpen={step === 'classificacao'} onClose={closeModal} title="Classificação de risco">
        <form onSubmit={submitClassificacao}>
          <AlertMessage message={modalError} type="error" />

          {suggestion ? (
            <div style={{
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Sugestão da IA
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 4, fontWeight: 700, fontSize: 12,
                  background: (PRIORITY_COLORS[suggestion.suggestedPriority] || '#6b7280') + '1a',
                  color: PRIORITY_COLORS[suggestion.suggestedPriority] || '#6b7280',
                }}>
                  {PRIORITY_LABELS[suggestion.suggestedPriority] || suggestion.suggestedPriority}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Score: {suggestion.score}</span>
              </div>
              {suggestion.reasons?.length > 0 && (
                <ul style={{ fontSize: 12, color: '#475569', paddingLeft: 16, lineHeight: 1.7, margin: 0 }}>
                  {suggestion.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <div className="state-box" style={{ padding: '16px 0', fontSize: 12 }}>
              Carregando sugestão de classificação...
            </div>
          )}

          <div className="field">
            <label>Prioridade final *</label>
            <select
              value={classForm.finalPriority}
              onChange={(e) => setClassForm((p) => ({ ...p, finalPriority: e.target.value }))}
              required
              disabled={busy}
            >
              <option value="">Selecione...</option>
              {Object.entries(PRIORITY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>

          {suggestion && classForm.finalPriority && classForm.finalPriority !== suggestion.suggestedPriority && (
            <div className="field">
              <label>Justificativa da alteração *</label>
              <textarea
                rows={3}
                value={classForm.overrideJustification}
                onChange={(e) => setClassForm((p) => ({ ...p, overrideJustification: e.target.value }))}
                style={taStyle}
                disabled={busy}
                required
              />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeModal} disabled={busy}>Fechar</button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={busy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {busy ? 'Confirmando...' : 'Confirmar e encaminhar →'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Routing modal ──────────────────────────────────────────── */}
      <Modal isOpen={step === 'encaminhamento'} onClose={closeModal} title="Encaminhamento">
        <form onSubmit={submitEncaminhamento}>
          <AlertMessage message={modalError} type="error" />

          {activeScreening?.finalPriority && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Prioridade:</span>
              <PriorityBadge priority={activeScreening.finalPriority} />
            </div>
          )}

          <div className="field">
            <label>Setor de destino</label>
            <select
              value={routeForm.destinationSector}
              onChange={(e) => setRouteForm((p) => ({ ...p, destinationSector: e.target.value }))}
              disabled={busy}
            >
              <option value="">Nenhum (a definir)</option>
              {Object.entries(SECTOR_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Notas de encaminhamento</label>
            <textarea
              rows={3}
              value={routeForm.routingNotes}
              onChange={(e) => setRouteForm((p) => ({ ...p, routingNotes: e.target.value }))}
              style={taStyle}
              disabled={busy}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeModal} disabled={busy}>Fechar</button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={busy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {busy ? 'Encaminhando...' : 'Encaminhar paciente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TriagemTab;
