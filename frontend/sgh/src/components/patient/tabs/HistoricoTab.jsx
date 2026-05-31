import { useState, useEffect, useCallback } from 'react';
import AlertMessage from '../../ui/AlertMessage';
import { getScreenings } from '../../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  VERMELHO: '#dc2626',
  LARANJA:  '#ea580c',
  AMARELO:  '#ca8a04',
  VERDE:    '#16a34a',
  AZUL:     '#2563eb',
};

const PRIORITY_SHORT = {
  VERMELHO: 'Emergência',
  LARANJA:  'Muito urgente',
  AMARELO:  'Urgente',
  VERDE:    'Pouco urgente',
  AZUL:     'Não urgente',
};

const SECTOR_LABELS = {
  SALA_EMERGENCIA:           'Emergência',
  CONSULTORIO_CLINICA_GERAL: 'Clínica Geral',
  CONSULTORIO_PEDIATRICO:    'Pediatria',
  CONSULTORIO_ORTOPEDICO:    'Ortopedia',
  SALA_MEDICACAO:            'Medicação',
  OBSERVACAO:                'Observação',
  SALA_SUTURAS:              'Suturas',
};

const STATUS_LABELS = {
  AGUARDANDO_CLASSIFICACAO: 'Em triagem',
  CLASSIFICADA:             'Classificado',
  AGUARDANDO_ATENDIMENTO:   'Aguardando',
  EM_ATENDIMENTO:           'Em atendimento',
  FINALIZADA:               'Finalizado',
  CANCELADA:                'Cancelado',
  AUSENTE:                  'Ausente',
};

const STATUS_BADGE = {
  AGUARDANDO_CLASSIFICACAO: 'badge-receptionist',
  CLASSIFICADA:             'badge-medic',
  AGUARDANDO_ATENDIMENTO:   'badge-nurse',
  EM_ATENDIMENTO:           'badge-active',
  FINALIZADA:               'badge-active',
  CANCELADA:                'badge-inactive',
  AUSENTE:                  'badge-inactive',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtMinutes = (mins) => {
  if (!mins && mins !== 0) return null;
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
};

const TERMINAL_STATUSES = new Set(['FINALIZADA', 'CANCELADA', 'AUSENTE']);
const ACTIVE_STATUSES   = new Set(['AGUARDANDO_CLASSIFICACAO', 'CLASSIFICADA', 'AGUARDANDO_ATENDIMENTO', 'EM_ATENDIMENTO']);

// ─── Main component ───────────────────────────────────────────────────────────

const HistoricoTab = ({ patientId }) => {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('all'); // 'all' | 'active' | 'terminal'

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getScreenings({ patientId });
      // Most recent first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setScreenings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const filtered = screenings.filter((s) => {
    if (filter === 'active')   return ACTIVE_STATUSES.has(s.status);
    if (filter === 'terminal') return TERMINAL_STATUSES.has(s.status);
    return true;
  });

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Histórico de triagens</div>
          <div className="section-subtitle">{screenings.length} triagem{screenings.length !== 1 ? 's' : ''} registrada{screenings.length !== 1 ? 's' : ''} no sistema</div>
        </div>
        <button className="btn-sm btn-outline" onClick={load}>Atualizar</button>
      </div>

      {error && <AlertMessage message={error} type="error" />}

      {/* Filter chips */}
      {screenings.length > 0 && (
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="toolbar-left">
            {[
              { id: 'all',      label: `Todas (${screenings.length})` },
              { id: 'active',   label: `Ativas (${screenings.filter(s => ACTIVE_STATUSES.has(s.status)).length})` },
              { id: 'terminal', label: `Finalizadas (${screenings.filter(s => TERMINAL_STATUSES.has(s.status)).length})` },
            ].map((f) => (
              <button
                key={f.id}
                className={`chip${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {screenings.length === 0
              ? 'Nenhuma triagem registrada ainda.'
              : 'Nenhuma triagem nesta categoria.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((sc) => {
            const priority = sc.finalPriority || sc.suggestedPriority;
            const color    = PRIORITY_COLORS[priority];
            const duration = fmtMinutes(sc.waitingTimeMinutes);
            const isActive = ACTIVE_STATUSES.has(sc.status);

            return (
              <div
                key={sc.id}
                style={{
                  background: '#fff',
                  border: `1px solid ${isActive ? '#bae6fd' : 'var(--border)'}`,
                  borderLeft: isActive ? '3px solid #2563eb' : undefined,
                  borderRadius: 8,
                  padding: '14px 18px',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge ${STATUS_BADGE[sc.status] || 'badge-inactive'}`}>
                      {STATUS_LABELS[sc.status] || sc.status}
                    </span>
                    {priority && color && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: color + '1a', color, border: `1px solid ${color}40`,
                      }}>
                        {priority} — {PRIORITY_SHORT[priority]}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {fmtDateTime(sc.createdAt)}
                  </span>
                </div>

                {/* Complaint */}
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                  {sc.mainComplaint}
                </div>

                {/* Bottom row: sector + duration */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                  {sc.destinationSector && (
                    <span>Setor: {SECTOR_LABELS[sc.destinationSector] || sc.destinationSector}</span>
                  )}
                  {duration && <span>Duração: {duration}</span>}
                  {sc.dischargeNotes && (
                    <span style={{ color: 'var(--text)', fontStyle: 'italic' }}>Alta: {sc.dischargeNotes}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoricoTab;
