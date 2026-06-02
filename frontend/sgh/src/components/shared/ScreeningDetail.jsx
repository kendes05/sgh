/**
 * ScreeningDetail
 * Componente de apresentação que exibe todos os dados de uma ScreeningResponse.
 * Usado no dashboard do médico: pré-visualização antes de iniciar atendimento
 * e no histórico de triagens de cada paciente.
 */

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

const STATUS_LABELS = {
  AGUARDANDO_CLASSIFICACAO: 'Aguardando classificação',
  CLASSIFICADA:             'Classificada',
  AGUARDANDO_ATENDIMENTO:   'Aguardando atendimento',
  EM_ATENDIMENTO:           'Em atendimento',
  FINALIZADA:               'Finalizada',
  CANCELADA:                'Cancelada',
  AUSENTE:                  'Ausente',
};

const SYMPTOM_LABELS = {
  TOSSE:               'Tosse',
  FALTA_DE_AR:         'Falta de ar',
  CHIADO_NO_PEITO:     'Chiado no peito',
  DOR_AO_RESPIRAR:     'Dor ao respirar',
  DOR_NO_PEITO:        'Dor no peito',
  PALPITACOES:         'Palpitações',
  INCHACO_NAS_PERNAS:  'Inchaço nas pernas',
  NAUSEA:              'Náusea',
  VOMITO:              'Vômito',
  VOMITO_PERSISTENTE:  'Vômito persistente',
  DIARREIA:            'Diarreia',
  DOR_ABDOMINAL:       'Dor abdominal',
  TONTURA:             'Tontura',
  CEFALEIA:            'Cefaleia',
  ALTERACAO_VISUAL:    'Alteração visual',
  FRAQUEZA_EM_MEMBROS: 'Fraqueza em membros',
  TRAUMA:              'Trauma',
  HEMORRAGIA_ATIVA:    'Hemorragia ativa',
  CONVULSAO:           'Convulsão',
  SINAIS_DESIDRATACAO: 'Sinais de desidratação',
  FERIMENTO_COM_CORTE: 'Ferimento com corte',
};

const fmtDateTime = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: 8, marginTop: 16,
  }}>
    {children}
  </div>
);

const TagList = ({ items }) => {
  if (!items?.length) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((item, i) => (
        <span key={i} style={{
          background: '#f3f4f6', border: '1px solid #e5e7eb',
          borderRadius: 4, padding: '2px 8px', fontSize: 12,
        }}>
          {item}
        </span>
      ))}
    </div>
  );
};

const VitalItem = ({ label, value, unit, highlight }) => (
  <div style={{
    background: highlight ? '#fef9c3' : '#f9fafb',
    border: `1px solid ${highlight ? '#fcd34d' : 'var(--border)'}`,
    borderRadius: 6, padding: '8px 12px', textAlign: 'center',
  }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{value ?? '—'}</div>
    {unit && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{unit}</div>}
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────

const ScreeningDetail = ({ screening }) => {
  if (!screening) return null;

  const {
    status, finalPriority, suggestedPriority, destinationSector,
    mainComplaint, complementarySymptoms, generalNotes,
    symptoms = [], allergies = [], medicationsInUse = [], comorbidities = [],
    vitalSigns, classifiedAt, createdAt,
    suggestedPriorityReason, overrideJustification, routingNotes,
  } = screening;

  const priority = finalPriority || suggestedPriority;
  const priorityColor = PRIORITY_COLORS[priority] || '#6b7280';

  return (
    <div>
      {/* ── Header: priority + status + date ───────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap', marginBottom: 14,
      }}>
        {priority && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700,
            background: priorityColor + '1a', color: priorityColor,
            border: `1px solid ${priorityColor}40`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColor }} />
            {PRIORITY_LABELS[priority] || priority}
          </span>
        )}
        {status && (
          <span className={`badge ${
            status === 'EM_ATENDIMENTO' ? 'badge-medic' :
            status === 'AGUARDANDO_ATENDIMENTO' ? 'badge-nurse' :
            status === 'FINALIZADA' ? 'badge-active' :
            status === 'CANCELADA' || status === 'AUSENTE' ? 'badge-inactive' :
            'badge-receptionist'
          }`}>
            {STATUS_LABELS[status] || status}
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {fmtDateTime(createdAt)}
        </span>
      </div>

      {/* ── Queixa principal ────────────────────────────────────── */}
      <div style={{
        background: '#f0f9ff', border: '1px solid #bae6fd',
        borderRadius: 6, padding: '10px 14px', marginBottom: 4,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
          Queixa principal
        </div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
          {mainComplaint}
        </div>
      </div>

      {/* ── Sinais vitais ────────────────────────────────────────── */}
      {vitalSigns && (
        <>
          <SectionTitle>Sinais vitais</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            <VitalItem
              label="Pressão"
              value={`${vitalSigns.pressaoSistolica}/${vitalSigns.pressaoDiastolica}`}
              unit="mmHg"
            />
            <VitalItem label="FC" value={vitalSigns.frequenciaCardiaca} unit="bpm" />
            <VitalItem label="FR" value={vitalSigns.frequenciaRespiratoria} unit="irpm" />
            <VitalItem
              label="Temp."
              value={vitalSigns.temperatura != null ? `${vitalSigns.temperatura}°C` : null}
            />
            <VitalItem label="SatO₂" value={vitalSigns.saturacaoOxigenio != null ? `${vitalSigns.saturacaoOxigenio}%` : null} />
            <VitalItem label="Glicemia" value={vitalSigns.glicemia} unit="mg/dL" />
            <VitalItem
              label="Dor"
              value={vitalSigns.escalaDor != null ? `${vitalSigns.escalaDor}/10` : null}
              highlight={vitalSigns.escalaDor >= 7}
            />
          </div>
        </>
      )}

      {/* ── Sintomas ─────────────────────────────────────────────── */}
      {symptoms.length > 0 && (
        <>
          <SectionTitle>Sintomas</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {symptoms.map((s) => (
              <span key={s} style={{
                background: '#fef3c7', border: '1px solid #fcd34d',
                borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 500, color: '#92400e',
              }}>
                {SYMPTOM_LABELS[s] || s}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── Sintomas complementares ──────────────────────────────── */}
      {complementarySymptoms && (
        <>
          <SectionTitle>Sintomas complementares</SectionTitle>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
            {complementarySymptoms}
          </p>
        </>
      )}

      {/* ── Alergias / Medicamentos / Comorbidades ───────────────── */}
      {(allergies.length > 0 || medicationsInUse.length > 0 || comorbidities.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
          {allergies.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Alergias
              </div>
              <TagList items={allergies} />
            </div>
          )}
          {medicationsInUse.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Medicamentos em uso
              </div>
              <TagList items={medicationsInUse} />
            </div>
          )}
          {comorbidities.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                Comorbidades
              </div>
              <TagList items={comorbidities} />
            </div>
          )}
        </div>
      )}

      {/* ── Observações gerais ───────────────────────────────────── */}
      {generalNotes && (
        <>
          <SectionTitle>Observações gerais</SectionTitle>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
            {generalNotes}
          </p>
        </>
      )}

      {/* ── Classificação ───────────────────────────────────────── */}
      {(suggestedPriorityReason || overrideJustification || routingNotes || destinationSector) && (
        <>
          <SectionTitle>Classificação e encaminhamento</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {destinationSector && (
              <div style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Setor: </span>
                <strong>{SECTOR_LABELS[destinationSector] || destinationSector}</strong>
              </div>
            )}
            {classifiedAt && (
              <div style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Classificado em: </span>
                {fmtDateTime(classifiedAt)}
              </div>
            )}
            {suggestedPriorityReason && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Motivo (IA): {suggestedPriorityReason}
              </div>
            )}
            {overrideJustification && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Justificativa da alteração: {overrideJustification}
              </div>
            )}
            {routingNotes && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Notas de encaminhamento: {routingNotes}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScreeningDetail;
