import { useState, useEffect, useCallback } from 'react';
import AlertMessage from '../../ui/AlertMessage';
import Modal from '../../ui/Modal';
import {
  getQueue,
  getScreeningStats,
  startAttendance,
  finishAttendance,
  getMedicalRecordByPatient,
  createMedicalRecord,
  addAppointment,
} from '../../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  VERMELHO: '#dc2626',
  LARANJA:  '#ea580c',
  AMARELO:  '#ca8a04',
  VERDE:    '#16a34a',
  AZUL:     '#2563eb',
};

const PRIORITY_LABELS = {
  VERMELHO: 'Vermelho',
  LARANJA:  'Laranja',
  AMARELO:  'Amarelo',
  VERDE:    'Verde',
  AZUL:     'Azul',
};

const SECTOR_LABELS = {
  SALA_EMERGENCIA:          'Emergência',
  CONSULTORIO_CLINICA_GERAL: 'Clínica Geral',
  CONSULTORIO_PEDIATRICO:   'Pediatria',
  CONSULTORIO_ORTOPEDICO:   'Ortopedia',
  SALA_MEDICACAO:           'Medicação',
  OBSERVACAO:               'Observação',
  SALA_SUTURAS:             'Suturas',
};

const APPOINTMENT_TYPE_LABELS = {
  CONSULTA:   'Consulta',
  RETORNO:    'Retorno',
  EMERGENCIA: 'Emergência',
};

const STATUS_LABELS = {
  AGUARDANDO_ATENDIMENTO: 'Aguardando',
  EM_ATENDIMENTO:         'Em atendimento',
};

const taStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 8, font: 'inherit', resize: 'vertical',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PriorityBadge = ({ priority }) => {
  if (!priority) return null;
  const color = PRIORITY_COLORS[priority] || '#6b7280';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: color + '1a', color, border: `1px solid ${color}40`,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
};

const fmtMinutes = (mins) => {
  if (mins == null) return '—';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
};

const nowIso = () => new Date().toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

// ─── Blank finish form ────────────────────────────────────────────────────────

const BLANK_FINISH = {
  dischargeNotes:       '',
  addAppointment:       false,
  dataAtendimento:      '',
  tipoAtendimento:      'CONSULTA',
  observacoesClinicas:  '',
};

// ─── Main component ───────────────────────────────────────────────────────────

const AtendimentosTab = ({ doctorId }) => {
  const [queue, setQueue]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  // Finish modal
  const [finishItem, setFinishItem] = useState(null); // QueueItemResponse
  const [finishForm, setFinishForm] = useState(BLANK_FINISH);
  const [busy, setBusy]     = useState(false);
  const [modalError, setModalError] = useState('');

  // Inline "starting" feedback per item
  const [startingId, setStartingId] = useState(null);

  // ─── Load data ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [q, s] = await Promise.all([getQueue(), getScreeningStats()]);
      setQueue(q);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Start attendance ───────────────────────────────────────────────

  const handleStart = async (item) => {
    setStartingId(item.id);
    try {
      await startAttendance(item.id, doctorId);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setStartingId(null);
    }
  };

  // ─── Open finish modal ──────────────────────────────────────────────

  const openFinish = (item) => {
    setFinishItem(item);
    setFinishForm({ ...BLANK_FINISH, dataAtendimento: nowIso() });
    setModalError('');
  };

  const closeFinish = () => { setFinishItem(null); setModalError(''); };

  // ─── Submit finish ──────────────────────────────────────────────────

  const handleFinish = async (e) => {
    e.preventDefault();
    if (finishForm.addAppointment && !finishForm.observacoesClinicas.trim()) {
      setModalError('Preencha as observações clínicas para registrar o atendimento.'); return;
    }
    if (finishForm.addAppointment && !finishForm.dataAtendimento) {
      setModalError('Informe a data e hora do atendimento.'); return;
    }

    setBusy(true);
    setModalError('');
    try {
      // 1. Finalizar triagem
      await finishAttendance(finishItem.id, {
        professionalId: doctorId,
        dischargeNotes: finishForm.dischargeNotes || null,
      });

      // 2. Registrar atendimento no prontuário (opcional)
      if (finishForm.addAppointment) {
        let record = await getMedicalRecordByPatient(finishItem.patientId);
        if (!record) record = await createMedicalRecord(finishItem.patientId);

        // datetime-local dá "YYYY-MM-DDTHH:mm" — adiciona segundos para o backend
        const dt = finishForm.dataAtendimento.length === 16
          ? `${finishForm.dataAtendimento}:00`
          : finishForm.dataAtendimento;

        await addAppointment(record.id, {
          dataAtendimento:     dt,
          idProfissional:      doctorId,
          tipoAtendimento:     finishForm.tipoAtendimento,
          observacoesClinicas: finishForm.observacoesClinicas.trim(),
        });
      }

      closeFinish();
      loadData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const waiting     = queue.filter((i) => i.status === 'AGUARDANDO_ATENDIMENTO').length;
  const inProgress  = queue.filter((i) => i.status === 'EM_ATENDIMENTO').length;

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Atendimentos</div>
          <div className="section-subtitle">Fila de pacientes aguardando ou em atendimento</div>
        </div>
        <button className="btn-sm btn-outline" onClick={loadData}>Atualizar</button>
      </div>

      {error && <AlertMessage message={error} type="error" />}

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total hoje</div>
          <div className="stat-value">{stats?.totalHoje ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aguardando</div>
          <div className="stat-value" style={{ color: '#ca8a04' }}>{waiting}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Em atendimento</div>
          <div className="stat-value" style={{ color: '#2563eb' }}>{inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tempo médio espera</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {stats?.tempoMedioEsperaMinutos != null
              ? `${Math.round(stats.tempoMedioEsperaMinutos)} min`
              : '—'}
          </div>
        </div>
      </div>

      {/* ── Queue table ────────────────────────────────────────────── */}
      {queue.length === 0 ? (
        <div className="table-card">
          <div className="state-box">Nenhum paciente na fila no momento.</div>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Prioridade</th>
                <th>Setor</th>
                <th>Espera</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => {
                const isWaiting    = item.status === 'AGUARDANDO_ATENDIMENTO';
                const isInProgress = item.status === 'EM_ATENDIMENTO';
                const isStarting   = startingId === item.id;
                const overdue      = item.remainingMinutes <= 0 && isWaiting;

                return (
                  <tr key={item.id}>
                    {/* Position */}
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                        background: isInProgress ? '#eff6ff' : '#f3f4f6',
                        color: isInProgress ? '#2563eb' : '#6b7280',
                        border: `1px solid ${isInProgress ? '#bfdbfe' : '#e5e7eb'}`,
                      }}>
                        {item.queuePosition}
                      </span>
                    </td>

                    {/* Patient */}
                    <td><strong>{item.patientName}</strong></td>

                    {/* Priority */}
                    <td><PriorityBadge priority={item.priority} /></td>

                    {/* Sector */}
                    <td className="td-muted">
                      {SECTOR_LABELS[item.sector] || item.sector || '—'}
                    </td>

                    {/* Elapsed */}
                    <td className="td-muted">{fmtMinutes(item.elapsedMinutes)}</td>

                    {/* Remaining */}
                    <td>
                      {isWaiting ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: overdue ? '#dc2626' : '#16a34a' }}>
                          {overdue
                            ? `+${fmtMinutes(Math.abs(item.remainingMinutes))} atrasado`
                            : fmtMinutes(item.remainingMinutes)}
                        </span>
                      ) : (
                        <span className="td-muted">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${isInProgress ? 'badge-medic' : 'badge-nurse'}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="action-group">
                        {isWaiting && (
                          <button
                            className="btn-sm btn-outline"
                            onClick={() => handleStart(item)}
                            disabled={isStarting}
                          >
                            {isStarting ? 'Iniciando...' : 'Iniciar atendimento'}
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            className="btn-sm btn-outline"
                            onClick={() => openFinish(item)}
                            style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
                          >
                            Finalizar
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
      )}

      {/* ── Priority distribution (if stats available) ─────────────── */}
      {stats?.porPrioridade && Object.keys(stats.porPrioridade).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Distribuição por prioridade — hoje
          </div>
          <div className="mini-stats">
            {Object.entries(stats.porPrioridade).map(([priority, count]) => {
              const color = PRIORITY_COLORS[priority] || '#6b7280';
              return (
                <div key={priority} className="mini-stat" style={{ borderColor: color + '40' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {PRIORITY_LABELS[priority] || priority}
                  <strong style={{ color }}>{count}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Finish attendance modal ─────────────────────────────────── */}
      <Modal
        isOpen={!!finishItem}
        onClose={closeFinish}
        title={`Finalizar atendimento — ${finishItem?.patientName}`}
        maxWidth="520px"
      >
        <form onSubmit={handleFinish}>
          <AlertMessage message={modalError} type="error" />

          {/* Priority reminder */}
          {finishItem?.priority && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Prioridade:</span>
              <PriorityBadge priority={finishItem.priority} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                Espera: {fmtMinutes(finishItem.elapsedMinutes)}
              </span>
            </div>
          )}

          {/* Discharge notes */}
          <div className="field">
            <label>Notas de alta</label>
            <textarea
              rows={3}
              value={finishForm.dischargeNotes}
              onChange={(e) => setFinishForm((p) => ({ ...p, dischargeNotes: e.target.value }))}
              style={taStyle}
              disabled={busy}
              placeholder="Instruções, orientações ao paciente (opcional)"
            />
          </div>

          {/* Optional appointment section */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 8,
            padding: '14px 16px', marginBottom: 4,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={finishForm.addAppointment}
                onChange={(e) => setFinishForm((p) => ({ ...p, addAppointment: e.target.checked }))}
                disabled={busy}
              />
              Registrar consulta no prontuário
            </label>

            {finishForm.addAppointment && (
              <div style={{ marginTop: 14 }}>
                <div className="form-row">
                  <div className="field">
                    <label>Tipo de atendimento *</label>
                    <select
                      value={finishForm.tipoAtendimento}
                      onChange={(e) => setFinishForm((p) => ({ ...p, tipoAtendimento: e.target.value }))}
                      disabled={busy}
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
                      value={finishForm.dataAtendimento}
                      onChange={(e) => setFinishForm((p) => ({ ...p, dataAtendimento: e.target.value }))}
                      disabled={busy}
                      required={finishForm.addAppointment}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Observações clínicas *</label>
                  <textarea
                    rows={4}
                    value={finishForm.observacoesClinicas}
                    onChange={(e) => setFinishForm((p) => ({ ...p, observacoesClinicas: e.target.value }))}
                    style={taStyle}
                    disabled={busy}
                    placeholder="Anamnese, diagnóstico, conduta..."
                    required={finishForm.addAppointment}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-sm btn-outline" onClick={closeFinish} disabled={busy}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-sm btn-outline"
              disabled={busy}
              style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
            >
              {busy ? 'Finalizando...' : 'Finalizar atendimento'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AtendimentosTab;
