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

const priorityWeight = {
  VERMELHO: 5,
  LARANJA: 4,
  AMARELO: 3,
  VERDE: 2,
  AZUL: 1,
};

const sortByPriority = (items) =>
  [...items].sort((first, second) => {
    const secondWeight = priorityWeight[second.finalPriority] || priorityWeight[second.suggestedPriority] || 0;
    const firstWeight = priorityWeight[first.finalPriority] || priorityWeight[first.suggestedPriority] || 0;

    if (secondWeight !== firstWeight) {
      return secondWeight - firstWeight;
    }

    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  });

const MedicDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [screenings, setScreenings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await getAllScreenings({ status: 'AGUARDANDO_ATENDIMENTO' });
        setScreenings(sortByPriority(data));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const criticalPatients = useMemo(
    () =>
      screenings.filter((screening) => ['VERMELHO', 'LARANJA'].includes(screening.finalPriority || screening.suggestedPriority)),
    [screenings],
  );

  const stats = useMemo(
    () => [
      {
        label: 'Fila aguardando atendimento',
        value: screenings.length,
        caption: 'Pacientes prontos para consulta medica',
      },
      {
        label: 'Pacientes criticos',
        value: criticalPatients.length,
        caption: 'Prioridades vermelha ou laranja no momento',
        className: criticalPatients.length ? 'warning' : 'success',
      },
    ],
    [criticalPatients.length, screenings.length],
  );

  return (
    <DashboardLayout
      title="SGH - Dashboard Medico"
      subtitle="Fila clinica priorizada para atendimento"
      userName={currentUser?.nome ?? 'Medico'}
      onLogout={logout}
    >
      <AlertMessage message={error} type="error" />

      {isLoading ? (
        <LoadingState title="Carregando fila medica..." description="Organizando pacientes por prioridade e tempo de espera." />
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

          <DashboardSection
            kicker="Fila"
            title="Pacientes aguardando atendimento"
            copy="A lista segue o ponto 2.2 do MVP: ordenada por prioridade e pronta para abrir o fluxo assistencial."
          >
            <ScreeningQueueCard
              title="Fila priorizada"
              description="Pacientes aguardando atendimento medico."
              screenings={screenings}
              emptyMessage="Nao ha pacientes aguardando atendimento neste momento."
              actionLabel="Abrir fluxo de triagem"
              onAction={() => navigate('/screenings')}
              showQueueMetrics
            />
          </DashboardSection>

          <DashboardSection
            kicker="Atalhos"
            title="Acoes rapidas"
            copy="Esses atalhos representam o acesso a detalhes da triagem e ao prontuario, como previsto no documento."
          >
            <div className="dashboard-grid">
              <QuickActionCard
                icon="TR"
                title="Ver detalhes da triagem"
                description="Acesse a central de triagens para acompanhar sinais vitais, prioridade e encaminhamento."
                badge="Disponivel"
                onClick={() => navigate('/screenings')}
              />
              <QuickActionCard
                icon="PR"
                title="Abrir prontuario"
                description="Atalho preparado para o prontuario do paciente assim que esse modulo entrar no fluxo."
                badge="Em breve"
                onClick={() => window.alert('O prontuario entra na proxima etapa do MVP.')}
              />
            </div>
          </DashboardSection>
        </>
      )}
    </DashboardLayout>
  );
};

export default MedicDashboard;
