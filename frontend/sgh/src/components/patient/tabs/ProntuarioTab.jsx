import { useState, useEffect, useCallback } from 'react';
import AlertMessage from '../../ui/AlertMessage';
import { getMedicalRecordByPatient } from '../../../services/api';

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
  const d = new Date(dob); const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  if (t.getMonth() - d.getMonth() < 0 || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) age--;
  return `${age} anos`;
};

const APPOINTMENT_TYPE_LABELS = {
  CONSULTA:   'Consulta',
  RETORNO:    'Retorno',
  EMERGENCIA: 'Emergência',
};

// ─── Section block ────────────────────────────────────────────────────────────

const Section = ({ title, count, empty, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{
      fontSize: 13, fontWeight: 600, marginBottom: 12,
      paddingBottom: 8, borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {title}
      <span style={{
        fontSize: 11, fontWeight: 600, background: '#f3f4f6',
        border: '1px solid var(--border)', borderRadius: 10,
        padding: '1px 7px', color: 'var(--text-muted)',
      }}>
        {count}
      </span>
    </div>
    {count === 0
      ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{empty}</p>
      : children}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ProntuarioTab = ({ patientId }) => {
  const [record, setRecord]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rec = await getMedicalRecordByPatient(patientId);
      setRecord(rec);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Prontuário</div>
          <div className="section-subtitle">Seu histórico clínico registrado no sistema</div>
        </div>
        <button className="btn-sm btn-outline" onClick={load}>Atualizar</button>
      </div>

      {error && <AlertMessage message={error} type="error" />}

      {!record ? (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Seu prontuário ainda não foi criado. Ele será criado pelo profissional de saúde na sua primeira consulta.
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px' }}>

          {/* Header info */}
          <div style={{
            background: '#f9fafb', borderRadius: 6, padding: '12px 16px',
            marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap',
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
              <span className="info-label">Criado em</span>
              <span className="info-value">{fmtDateTime(record.criadoEm)}</span>
            </div>
          </div>

          {/* Atendimentos */}
          <Section
            title="Atendimentos médicos"
            count={record.atendimentos?.length || 0}
            empty="Nenhum atendimento médico registrado."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {record.atendimentos?.map((a) => (
                <div key={a.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
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
          </Section>

          {/* Medicamentos */}
          <Section
            title="Medicamentos"
            count={record.medicamentos?.length || 0}
            empty="Nenhum medicamento registrado."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {record.medicamentos?.map((m) => (
                <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.nomeMedicamento}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {m.dosagem} · {m.duracaoTratamento}
                    {m.dataInicio ? ` · Início: ${fmtDate(m.dataInicio)}` : ''}
                  </div>
                  {m.observacoes && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>{m.observacoes}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Exames */}
          <Section
            title="Exames"
            count={record.exames?.length || 0}
            empty="Nenhum exame registrado."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {record.exames?.map((ex) => (
                <div key={ex.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{ex.tipoExame}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Realizado em: {fmtDate(ex.dataRealizacao)}
                  </div>
                  {ex.resultadoTexto && (
                    <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{ex.resultadoTexto}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>

        </div>
      )}
    </div>
  );
};

export default ProntuarioTab;
