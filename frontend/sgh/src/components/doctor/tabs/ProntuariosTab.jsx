import { useState, useEffect, useCallback } from 'react';
import AlertMessage from '../../ui/AlertMessage';
import Modal from '../../ui/Modal';
import {
  getAllPatients,
  getMedicalRecordByPatient,
  createMedicalRecord,
  addAppointment,
  addMedication,
  addExam,
} from '../../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => {
  if (!d) return '—';
  const s = typeof d === 'string' ? d : String(d);
  const [y, m, day] = s.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const calcAge = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age--;
  return `${age} anos`;
};

const fmtBloodType = (bt) => bt?.replace('_POS', '+').replace('_NEG', '-') || '—';

const taStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 8, font: 'inherit', resize: 'vertical',
};

const nowIso = () => new Date().toISOString().slice(0, 16);

const BLANK_APPT = { dataAtendimento: '', tipoAtendimento: 'CONSULTA', observacoesClinicas: '' };
const BLANK_MED  = { nomeMedicamento: '', dosagem: '', duracaoTratamento: '', observacoes: '', dataInicio: '' };
const BLANK_EXAM = { tipoExame: '', dataRealizacao: '', resultadoTexto: '' };

const APPOINTMENT_TYPE_LABELS = {
  CONSULTA:   'Consulta',
  RETORNO:    'Retorno',
  EMERGENCIA: 'Emergência',
};

// ─── Main component ───────────────────────────────────────────────────────────

const ProntuariosTab = ({ doctorId }) => {
  const [patients, setPatients]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [record, setRecord]       = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError]     = useState('');
  const [showRecord, setShowRecord]       = useState(false);

  // sub-modal: null | 'appointment' | 'medication' | 'exam'
  const [subModal, setSubModal]   = useState(null);
  const [apptForm, setApptForm]   = useState(BLANK_APPT);
  const [medForm, setMedForm]     = useState(BLANK_MED);
  const [examForm, setExamForm]   = useState(BLANK_EXAM);
  const [subBusy, setSubBusy]     = useState(false);
  const [subError, setSubError]   = useState('');

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllPatients();
      setPatients(data.filter((p) => p.isActive));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const filtered = patients.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Open / close record modal ─────────────────────────────────────

  const openRecord = async (patient) => {
    setSelectedPatient(patient);
    setRecord(null);
    setRecordError('');
    setSubModal(null);
    setShowRecord(true);
    setRecordLoading(true);
    try {
      const rec = await getMedicalRecordByPatient(patient.id);
      setRecord(rec);
    } catch (err) {
      setRecordError(err.message);
    } finally {
      setRecordLoading(false);
    }
  };

  const closeRecord = () => {
    setShowRecord(false);
    setSubModal(null);
    setRecord(null);
    setSelectedPatient(null);
    setRecordError('');
  };

  const handleCreateRecord = async () => {
    setRecordLoading(true);
    setRecordError('');
    try {
      const rec = await createMedicalRecord(selectedPatient.id);
      setRecord(rec);
    } catch (err) {
      setRecordError(err.message);
    } finally {
      setRecordLoading(false);
    }
  };

  // ─── Sub-modals ────────────────────────────────────────────────────

  const openAddAppt = () => { setApptForm({ ...BLANK_APPT, dataAtendimento: nowIso() }); setSubError(''); setSubModal('appointment'); };
  const openAddMed  = () => { setMedForm(BLANK_MED);  setSubError(''); setSubModal('medication'); };
  const openAddExam = () => { setExamForm(BLANK_EXAM); setSubError(''); setSubModal('exam'); };
  const closeSubModal = () => { setSubModal(null); setSubError(''); };

  // ─── Submits ───────────────────────────────────────────────────────

  const submitAppointment = async (e) => {
    e.preventDefault();
    if (!apptForm.observacoesClinicas.trim()) {
      setSubError('Observações clínicas são obrigatórias.'); return;
    }
    if (!apptForm.dataAtendimento) {
      setSubError('Informe a data e hora do atendimento.'); return;
    }
    setSubBusy(true); setSubError('');
    try {
      const dt = apptForm.dataAtendimento.length === 16
        ? `${apptForm.dataAtendimento}:00`
        : apptForm.dataAtendimento;

      const appt = await addAppointment(record.id, {
        dataAtendimento:     dt,
        idProfissional:      doctorId,
        tipoAtendimento:     apptForm.tipoAtendimento,
        observacoesClinicas: apptForm.observacoesClinicas.trim(),
      });
      setRecord((prev) => ({ ...prev, atendimentos: [appt, ...(prev.atendimentos || [])] }));
      closeSubModal();
    } catch (err) {
      setSubError(err.message);
    } finally {
      setSubBusy(false);
    }
  };

  const submitMedication = async (e) => {
    e.preventDefault();
    if (!medForm.nomeMedicamento || !medForm.dosagem || !medForm.duracaoTratamento) {
      setSubError('Preencha todos os campos obrigatórios.'); return;
    }
    setSubBusy(true); setSubError('');
    try {
      const med = await addMedication(record.id, {
        nomeMedicamento: medForm.nomeMedicamento,
        dosagem:         medForm.dosagem,
        duracaoTratamento: medForm.duracaoTratamento,
        observacoes:     medForm.observacoes || null,
        dataInicio:      medForm.dataInicio || null,
      });
      setRecord((prev) => ({ ...prev, medicamentos: [med, ...(prev.medicamentos || [])] }));
      closeSubModal();
    } catch (err) {
      setSubError(err.message);
    } finally {
      setSubBusy(false);
    }
  };

  const submitExam = async (e) => {
    e.preventDefault();
    if (!examForm.tipoExame || !examForm.dataRealizacao) {
      setSubError('Preencha todos os campos obrigatórios.'); return;
    }
    setSubBusy(true); setSubError('');
    try {
      const exam = await addExam(record.id, {
        tipoExame:       examForm.tipoExame,
        dataRealizacao:  examForm.dataRealizacao,
        resultadoTexto:  examForm.resultadoTexto || null,
        resultadoEstruturado: null,
      });
      setRecord((prev) => ({ ...prev, exames: [exam, ...(prev.exames || [])] }));
      closeSubModal();
    } catch (err) {
      setSubError(err.message);
    } finally {
      setSubBusy(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Prontuários</div>
          <div className="section-subtitle">Consulte e registre informações clínicas dos pacientes</div>
        </div>
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
              <th>Tipo sanguíneo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}><div className="state-box">Nenhum paciente encontrado.</div></td>
              </tr>
            ) : filtered.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.nome}</strong></td>
                <td className="td-muted">{p.cpf}</td>
                <td className="td-muted">{calcAge(p.dataNascimento)}</td>
                <td className="td-muted">{fmtBloodType(p.tipoSanguineo)}</td>
                <td>
                  <button className="btn-sm btn-outline" onClick={() => openRecord(p)}>
                    Ver prontuário
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Record modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showRecord}
        onClose={closeRecord}
        title={`Prontuário — ${selectedPatient?.nome}`}
        maxWidth="640px"
      >
        {recordLoading ? (
          <div className="state-box"><span className="spinner--page" /></div>
        ) : recordError ? (
          <AlertMessage message={recordError} type="error" />
        ) : !record ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Este paciente ainda não possui prontuário registrado.
            </p>
            <button
              className="btn-sm btn-outline"
              onClick={handleCreateRecord}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              Criar prontuário
            </button>
          </div>
        ) : (
          <div>
            {/* Patient summary */}
            <div style={{
              background: '#f9fafb', border: '1px solid var(--border)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20,
              display: 'flex', gap: 24, flexWrap: 'wrap',
            }}>
              <div className="info-row">
                <span className="info-label">Nascimento</span>
                <span className="info-value">{fmtDate(record.dataNascimentoPaciente)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Idade</span>
                <span className="info-value">{calcAge(record.dataNascimentoPaciente)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">E-mail</span>
                <span className="info-value">{record.emailPaciente || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ID do prontuário</span>
                <span className="info-value" style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {record.id}
                </span>
              </div>
            </div>

            {/* ── Appointments (MEDIC can add) ──────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Atendimentos médicos ({record.atendimentos?.length || 0})
                </span>
                <button className="btn-sm btn-outline" onClick={openAddAppt}>+ Registrar</button>
              </div>
              {!record.atendimentos?.length ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum atendimento registrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {record.atendimentos.map((a) => (
                    <div key={a.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ fontSize: 13 }}>{a.nomeProfissional || 'Médico'}</strong>
                          <span className="badge badge-medic" style={{ fontSize: 10 }}>
                            {APPOINTMENT_TYPE_LABELS[a.tipoAtendimento] || a.tipoAtendimento}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {fmtDateTime(a.dataAtendimento)}
                        </span>
                      </div>
                      {a.observacoesClinicas && (
                        <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                          {a.observacoesClinicas}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Medications ───────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Medicamentos ({record.medicamentos?.length || 0})
                </span>
                <button className="btn-sm btn-outline" onClick={openAddMed}>+ Adicionar</button>
              </div>
              {!record.medicamentos?.length ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum medicamento registrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {record.medicamentos.map((m) => (
                    <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.nomeMedicamento}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {m.dosagem} · {m.duracaoTratamento}
                        {m.dataInicio ? ` · Início: ${fmtDate(m.dataInicio)}` : ''}
                      </div>
                      {m.observacoes && <div style={{ fontSize: 12, marginTop: 4 }}>{m.observacoes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Exams ────────────────────────────────────────────── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Exames ({record.exames?.length || 0})
                </span>
                <button className="btn-sm btn-outline" onClick={openAddExam}>+ Adicionar</button>
              </div>
              {!record.exames?.length ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum exame registrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {record.exames.map((ex) => (
                    <div key={ex.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ex.tipoExame}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Realizado em: {fmtDate(ex.dataRealizacao)}
                      </div>
                      {ex.resultadoTexto && (
                        <div style={{ fontSize: 12, marginTop: 4 }}>{ex.resultadoTexto}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add appointment modal ─────────────────────────────────────── */}
      <Modal isOpen={subModal === 'appointment'} onClose={closeSubModal} title="Registrar atendimento">
        <form onSubmit={submitAppointment}>
          <AlertMessage message={subError} type="error" />
          <div className="form-row">
            <div className="field">
              <label>Tipo de atendimento *</label>
              <select
                value={apptForm.tipoAtendimento}
                onChange={(e) => setApptForm((p) => ({ ...p, tipoAtendimento: e.target.value }))}
                disabled={subBusy}
              >
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Data e hora *</label>
              <input
                type="datetime-local"
                value={apptForm.dataAtendimento}
                onChange={(e) => setApptForm((p) => ({ ...p, dataAtendimento: e.target.value }))}
                disabled={subBusy}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>Observações clínicas *</label>
            <textarea
              rows={5}
              value={apptForm.observacoesClinicas}
              onChange={(e) => setApptForm((p) => ({ ...p, observacoesClinicas: e.target.value }))}
              style={taStyle}
              disabled={subBusy}
              placeholder="Anamnese, diagnóstico, exame físico, conduta..."
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeSubModal} disabled={subBusy}>Cancelar</button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={subBusy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {subBusy ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add medication modal ──────────────────────────────────────── */}
      <Modal isOpen={subModal === 'medication'} onClose={closeSubModal} title="Adicionar medicamento">
        <form onSubmit={submitMedication}>
          <AlertMessage message={subError} type="error" />
          <div className="field">
            <label>Medicamento *</label>
            <input
              value={medForm.nomeMedicamento}
              onChange={(e) => setMedForm((p) => ({ ...p, nomeMedicamento: e.target.value }))}
              required disabled={subBusy}
              placeholder="Ex.: Amoxicilina"
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Dosagem *</label>
              <input
                value={medForm.dosagem}
                onChange={(e) => setMedForm((p) => ({ ...p, dosagem: e.target.value }))}
                required disabled={subBusy}
                placeholder="Ex.: 500 mg"
              />
            </div>
            <div className="field">
              <label>Duração do tratamento *</label>
              <input
                value={medForm.duracaoTratamento}
                onChange={(e) => setMedForm((p) => ({ ...p, duracaoTratamento: e.target.value }))}
                required disabled={subBusy}
                placeholder="Ex.: 7 dias"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Data de início</label>
              <input
                type="date"
                value={medForm.dataInicio}
                onChange={(e) => setMedForm((p) => ({ ...p, dataInicio: e.target.value }))}
                disabled={subBusy}
              />
            </div>
            <div className="field">
              <label>Observações</label>
              <input
                value={medForm.observacoes}
                onChange={(e) => setMedForm((p) => ({ ...p, observacoes: e.target.value }))}
                disabled={subBusy}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeSubModal} disabled={subBusy}>Cancelar</button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={subBusy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {subBusy ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Add exam modal ────────────────────────────────────────────── */}
      <Modal isOpen={subModal === 'exam'} onClose={closeSubModal} title="Adicionar exame">
        <form onSubmit={submitExam}>
          <AlertMessage message={subError} type="error" />
          <div className="form-row">
            <div className="field">
              <label>Tipo de exame *</label>
              <input
                value={examForm.tipoExame}
                onChange={(e) => setExamForm((p) => ({ ...p, tipoExame: e.target.value }))}
                required disabled={subBusy}
                placeholder="Ex.: Hemograma completo"
              />
            </div>
            <div className="field">
              <label>Data de realização *</label>
              <input
                type="date"
                value={examForm.dataRealizacao}
                onChange={(e) => setExamForm((p) => ({ ...p, dataRealizacao: e.target.value }))}
                required disabled={subBusy}
              />
            </div>
          </div>
          <div className="field">
            <label>Resultado</label>
            <textarea
              rows={3}
              value={examForm.resultadoTexto}
              onChange={(e) => setExamForm((p) => ({ ...p, resultadoTexto: e.target.value }))}
              style={taStyle}
              disabled={subBusy}
              placeholder="Descreva o resultado (opcional)"
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeSubModal} disabled={subBusy}>Cancelar</button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={subBusy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {subBusy ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProntuariosTab;
