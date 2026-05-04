import EmptyState from '../ui/EmptyState';

const PRIORITY_META = {
  VERMELHO: { label: 'Vermelho', className: 'critical' },
  LARANJA: { label: 'Laranja', className: 'high' },
  AMARELO: { label: 'Amarelo', className: 'medium' },
  VERDE: { label: 'Verde', className: 'low' },
  AZUL: { label: 'Azul', className: 'info' },
};

const STATUS_META = {
  AGUARDANDO_CLASSIFICACAO: { label: 'Aguardando classificacao', className: 'warning' },
  CLASSIFICADA: { label: 'Classificada', className: 'active' },
  AGUARDANDO_ATENDIMENTO: { label: 'Aguardando atendimento', className: 'info' },
};

const formatDateTime = (value) => {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('pt-BR');
};

const ScreeningQueueCard = ({
  title,
  description,
  screenings,
  emptyMessage,
  actionLabel,
  onAction,
  showQueueMetrics = false,
}) => {
  if (!screenings.length) {
    return (
      <div className="queue-card">
        <div className="queue-card-header">
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        <EmptyState icon="+" message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="queue-card">
      <div className="queue-card-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>

      <div className="queue-list">
        {screenings.map((screening) => {
          const priorityMeta =
            PRIORITY_META[screening.finalPriority] || PRIORITY_META[screening.suggestedPriority] || PRIORITY_META.AZUL;
          const statusMeta = STATUS_META[screening.status] || STATUS_META.AGUARDANDO_ATENDIMENTO;

          return (
            <article key={screening.id} className="queue-item">
              <div className="queue-item-top">
                <div>
                  <h4>{screening.patientName || 'Paciente sem nome'}</h4>
                  <p>{screening.mainComplaint || 'Queixa principal nao informada.'}</p>
                </div>
                <div className="detail-badges">
                  <span className={`status-pill ${statusMeta.className}`}>{statusMeta.label}</span>
                  <span className={`priority-pill ${priorityMeta.className}`}>{priorityMeta.label}</span>
                </div>
              </div>

              <div className="queue-meta">
                <span>Criada em {formatDateTime(screening.createdAt)}</span>
                {showQueueMetrics ? (
                  <>
                    <span>Posicao {screening.queueMetrics?.queuePosition ?? '--'}</span>
                    <span>Espera {screening.queueMetrics?.remainingMinutes ?? '--'} min</span>
                  </>
                ) : null}
              </div>

              {onAction ? (
                <button type="button" className="action-btn btn-edit" onClick={() => onAction(screening)}>
                  {actionLabel}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ScreeningQueueCard;
