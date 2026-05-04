import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDoctors, getAllPatients, getAllScreenings } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import LoadingState from '../ui/LoadingState';
import DashboardSection from './DashboardSection';
import QuickActionCard from './QuickActionCard';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError('');

        const [patientsData, doctorsData, screeningsData] = await Promise.all([
          getAllPatients(),
          getAllDoctors(),
          getAllScreenings(),
        ]);

        setPatients(patientsData);
        setDoctors(doctorsData);
        setScreenings(screeningsData);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const openScreenings = screenings.filter((screening) =>
      ['AGUARDANDO_CLASSIFICACAO', 'AGUARDANDO_ATENDIMENTO'].includes(screening.status),
    ).length;

    return [
      {
        label: 'Pacientes cadastrados',
        value: patients.length,
        caption: 'Base total de pacientes do hospital',
      },
      {
        label: 'Profissionais cadastrados',
        value: doctors.length,
        caption: 'Equipe clinica registrada no sistema',
        className: 'success',
      },
      {
        label: 'Triagens abertas',
        value: openScreenings,
        caption: 'Casos aguardando classificacao ou atendimento',
        className: 'warning',
      },
    ];
  }, [doctors, patients, screenings]);

  const quickActions = [
    {
      icon: 'US',
      title: 'Gerenciar Usuarios',
      description: 'Area prevista no MVP para contas internas e perfis de acesso.',
      badge: 'Proximo modulo',
      onClick: () => window.alert('A gestao de usuarios fica para a proxima etapa do MVP.'),
    },
    {
      icon: 'PC',
      title: 'Gerenciar Pacientes',
      description: 'Abra a listagem com cadastro, edicao e status dos pacientes.',
      badge: 'Disponivel',
      onClick: () => navigate('/admin/pacientes'),
    },
    {
      icon: 'PF',
      title: 'Gerenciar Profissionais',
      description: 'Acesse o cadastro da equipe assistencial e seus dados principais.',
      badge: 'Disponivel',
      onClick: () => navigate('/admin/profissionais'),
    },
  ];

  return (
    <DashboardLayout
      title="SGH - Dashboard Administrativo"
      subtitle="Visao executiva das operacoes e atalhos de gestao"
      userName={currentUser?.nome ?? 'Administrador'}
      onLogout={logout}
    >
      <AlertMessage message={error} type="error" />

      {isLoading ? (
        <LoadingState title="Carregando dashboard..." description="Buscando pacientes, equipe e triagens abertas." />
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
            kicker="Atalhos"
            title="Acessos rapidos do Admin"
            copy="Os cards abaixo seguem o documento do MVP e encurtam o caminho para as areas operacionais mais usadas."
          >
            <div className="dashboard-grid">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} {...action} />
              ))}
            </div>
          </DashboardSection>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
