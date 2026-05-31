import { useState, useEffect, useCallback } from 'react';
import AlertMessage from '../../ui/AlertMessage';
import { getActiveScreeningByPatient } from '../../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  VERMELHO: '#dc2626',
  LARANJA:  '#ea580c',
  AMARELO:  '#ca8a04',
  VERDE:    '#16a34a',
  AZUL:     '#2563eb',
};

const PRIORITY_LABELS = {
  VERMELHO: 'Vermelho — Emergência',
  LARANJA:  'Laranja — Muito urgente',
  AMARELO:  'Amarelo — Urgente',
  VERDE:    'Verde — Pouco urgente',
  AZUL:     'Azul — Não urgente',
};

const SECTOR_LABELS = {
  SALA_EMERGENCIA:           'Sala de Emergência',
  CONSULTORIO_CLINICA_GERAL: 'Consultório — Clínica Geral',
  CONSULTORIO_PEDIATRICO:    'Consultório Pediátrico',
  CONSULTORIO_ORTOPEDICO:    'Consultório Ortopédico',
  SALA_MEDICACAO:            'Sala de Medicação',
  OBSERVACAO:                'Observação',
  SALA_SUTURAS:              'Sala de Suturas',
};

const STATUS_MESSAGES = {
  AGUARDANDO_CLASSIFICACAO: 'Sua triagem foi registrada e está aguardando avaliação da enfermagem.',
  CLASSIFICADA:             'Sua triagem foi classificada e você será encaminhado em breve.',
  AGUARDANDO_ATENDIMENTO:   'Você está na fila de atendimento médico.',
  EM_ATENDIMENTO:           'Você está sendo atendido no momento.',
};

// Índice do passo ativo baseado no status
const STATUS_STEP = {
  AGUARDANDO_CLASSIFICACAO: 0,
  CLASSIFICADA:             1,
  AGUARDANDO_ATENDIMENTO:   2,
  EM_ATENDIMENTO:           3,
};

const STEPS = [
  'Triagem registrada',
  'Classificado',
  'Na fila',
  'Em atendimento',
];

const fmtMinutes = (mins) => {
  if (mins == null || mins < 0) return '—';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
};

const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ currentStep }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28 }}>
    {STEPS.map((label, idx) => {
      const state = idx < currentStep ? 'done' : idx === currentStep ? 'active' : 'pending';
      const color = state === 'done' ? '#2563eb' : state === 'active' ? '#2563eb' : '#d1d5db';
      const textColor = state === 'pending' ? 'var(--text-muted)' : 'var(--text)';

      return (
        <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          {/* Step circle + label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
              background: state === 'pending' ? '#f3f4f6' : state === 'done' ? '#2563eb' : '#eff6ff',
              color: state === 'pending' ? '#9ca3af' : state === 'done' ? '#fff' : '#2563eb',
              border: `2px solid ${color}`,
              position: 'relative',
              boxShadow: state === 'active' ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
              flexShrink: 0,
            }}>
              {state === 'done' ? '✓' : idx + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: state === 'active' ? 600 : 400,
              color: textColor, textAlign: 'center', lineHeight: 1.3,
              maxWidth: 80,
            }}>
              {label}
            </span>
          </div>

          {/* Connector line */}
          {idx < STEPS.length - 1 && (
            <div style={{
              height: 2, flex: 1, marginTop: 15, flexShrink: 0,
              background: idx < currentStep ? '#2563eb' : '#e5e7eb',
            }} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Info row ──────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>
      {children ?? value}
    </span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const StatusTab = ({ patientId }) => {
  const [screening, setScreening] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const s = await getActiveScreeningByPatient(patientId);
      setScreening(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Meu status</div>
          <div className="section-subtitle">Acompanhe sua posição no fluxo de atendimento</div>
        </div>
        <button className="btn-sm btn-outline" onClick={load}>Atualizar</button>
      </div>

      {error && <AlertMessage message={error} type="error" />}

      {!screening ? (
        /* ── No active screening ─────────────────────────────── */
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
          padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Nenhuma triagem ativa
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Você não possui atendimento em andamento no momento.<br />
            Caso precise de atendimento, dirija-se à recepção.
          </div>
        </div>
      ) : (
        /* ── Active screening ────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Progress steps */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 24px 16px' }}>
            <StepIndicator currentStep={STATUS_STEP[screening.status] ?? 0} />

            {/* Status message */}
            {STATUS_MESSAGES[screening.status] && (
              <div style={{
                background: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: 6, padding: '10px 14px', fontSize: 13,
                color: '#0369a1', lineHeight: 1.5,
              }}>
                {STATUS_MESSAGES[screening.status]}
              </div>
            )}
          </div>

          {/* Detail card */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 20px 8px' }}>

            <InfoRow label="Queixa principal">
              <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                {screening.mainComplaint}
              </span>
            </InfoRow>

            <InfoRow label="Registrado em">
              {fmtDateTime(screening.createdAt)}
            </InfoRow>

            {/* Priority (available after classification) */}
            {(screening.finalPriority || screening.suggestedPriority) && (() => {
              const p = screening.finalPriority || screening.suggestedPriority;
              const color = PRIORITY_COLORS[p] || '#6b7280';
              return (
                <InfoRow label="Prioridade atribuída">
                  <span style={{
                    padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                    background: color + '1a', color, border: `1px solid ${color}40`,
                  }}>
                    {PRIORITY_LABELS[p] || p}
                  </span>
                </InfoRow>
              );
            })()}

            {/* Destination sector */}
            {screening.destinationSector && (
              <InfoRow label="Setor de atendimento">
                {SECTOR_LABELS[screening.destinationSector] || screening.destinationSector}
              </InfoRow>
            )}

            {/* Queue metrics (when waiting or in attendance) */}
            {screening.queueMetrics && (
              <>
                {screening.queueMetrics.queuePosition > 0 && (
                  <InfoRow label="Posição na fila">
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {screening.queueMetrics.queuePosition}ª
                    </span>
                  </InfoRow>
                )}

                <InfoRow label="Tempo de espera">
                  {fmtMinutes(screening.queueMetrics.elapsedMinutes)}
                </InfoRow>

                {screening.status === 'AGUARDANDO_ATENDIMENTO' && (
                  <InfoRow label="Prazo restante">
                    <span style={{
                      fontWeight: 600,
                      color: screening.queueMetrics.remainingMinutes <= 0 ? '#dc2626' : '#16a34a',
                    }}>
                      {screening.queueMetrics.remainingMinutes <= 0
                        ? `Atrasado ${fmtMinutes(Math.abs(screening.queueMetrics.remainingMinutes))}`
                        : fmtMinutes(screening.queueMetrics.remainingMinutes)}
                    </span>
                  </InfoRow>
                )}
              </>
            )}

            {/* waitingTimeMinutes when EM_ATENDIMENTO */}
            {screening.status === 'EM_ATENDIMENTO' && screening.waitingTimeMinutes > 0 && (
              <InfoRow label="Tempo total no fluxo">
                {fmtMinutes(screening.waitingTimeMinutes)}
              </InfoRow>
            )}
          </div>

          {/* Hint */}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Use o botão "Atualizar" para ver as informações mais recentes.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusTab;
