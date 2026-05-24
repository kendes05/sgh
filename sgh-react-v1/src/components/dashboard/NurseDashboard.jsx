import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllScreenings } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import LoadingState from '../ui/LoadingState';
import DashboardSection from './DashboardSection';
import QuickActionCard from './QuickActionCard';
import ScreeningQueueCard from './ScreeningQueueCard';

const NurseDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [pendingClassification, setPendingClassification] = useState([]);
  const [pendingRouting, setPendingRouting] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [classificationData, routingData] = await Promise.all([
          getAllScreenings({ status: 'AGUARDANDO_CLASSIFICACAO' }),
          getAllScreenings({ status: 'CLASSIFICADA' }),
        ]);

        setPendingClassification(classificationData);
        setPendingRouting(routingData);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Pendentes de classificacao',
        value: pendingClassification.length,
        caption: 'Triagens aguardando avaliacao inicial',
        className: pendingClassification.length ? 'warning' : 'success',
      },
      {
        label: 'Pendentes de encaminhamento',
        value: pendingRouting.length,
        caption: 'Casos classificados aguardando destino',
      },
    ],
    [pendingClassification.length, pendingRouting.length],
  );

  return (
    <DashboardLayout
      title="SGH - Dashboard da Enfermagem"
      subtitle="Controle das triagens e da preparacao do atendimento"
      userName={currentUser?.nome ?? 'Enfermagem'}
      onLogout={logout}
    >
      <AlertMessage message={error} type="error" />

      {isLoading ? (
        <LoadingState title="Carregando painel da enfermagem..." description="Buscando triagens pendentes por etapa do fluxo." />
      ) : (
        <>
          <div className="dashboard-grid">
            {stats.map((stat) => (
              <div key={stat.label} className={`stat-card ${stat.className ?? ''}`.trim()}>
                <h3>{stat.label}</h3>
                <div className="stat-value">{stat.value}</div>
                <p className="stat-caption">{stat.caption}</p>
              </div>
            ))}
          </div>

          <div className="dashboard-dual-grid">
            <ScreeningQueueCard
              title="Triagens pendentes de classificacao"
              description="Casos aguardando definicao de prioridade."
              screenings={pendingClassification}
              emptyMessage="Nenhuma triagem pendente de classificacao."
              actionLabel="Abrir central"
              onAction={() => navigate('/screenings')}
            />

            <ScreeningQueueCard
              title="Triagens pendentes de encaminhamento"
              description="Casos classificados aguardando definicao de setor."
              screenings={pendingRouting}
              emptyMessage="Nenhuma triagem classificada aguardando encaminhamento."
              actionLabel="Abrir central"
              onAction={() => navigate('/screenings')}
            />
          </div>

          <DashboardSection
            kicker="Atalhos"
            title="Acoes rapidas da enfermagem"
            copy="Os atalhos abaixo cobrem o que o ponto 2.3 pede para a dashboard da enfermagem."
          >
            <div className="dashboard-grid">
              <QuickActionCard
                icon="NT"
                title="Iniciar nova triagem"
                description="Abra a central de triagens para cadastrar uma nova entrada do paciente."
                badge="Disponivel"
                onClick={() => navigate('/screenings')}
              />
              <QuickActionCard
                icon="BP"
                title="Buscar paciente por e-mail"
                description="Atalho preparado para a busca por e-mail na etapa de gestao de pacientes do MVP."
                badge="Em breve"
                onClick={() => window.alert('A busca direta por e-mail entra na proxima etapa da gestao de pacientes.')}
              />
            </div>
          </DashboardSection>
        </>
      )}
    </DashboardLayout>
  );
};

export default NurseDashboard;
