import { useEffect, useState } from 'react';
import { getPatientByEmail } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import FeatureCard from '../ui/FeatureCard';
import PatientInfoCard from './PatientInfoCard';

const featureCards = [
  {
    icon: 'TO',
    title: 'Triagem Online',
    description: 'Área reservada para acompanhamento inicial antes do atendimento.',
  },
  {
    icon: 'MC',
    title: 'Minhas Consultas',
    description: 'Espaço pronto para agenda, confirmação e histórico de consultas.',
  },
  {
    icon: 'EX',
    title: 'Meus Exames',
    description: 'Estrutura prevista para resultados e documentos clínicos.',
  },
  {
    icon: 'RX',
    title: 'Receitas',
    description: 'Fluxo futuro para prescrições e orientações do tratamento.',
  },
];

const PatientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatient = async () => {
      try {
        setIsLoading(true);
        const data = await getPatientByEmail(currentUser.email);
        setPatient(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.email) {
      loadPatient();
    }
  }, [currentUser]);

  const showDevMessage = () => {
    window.alert('Esse serviço ainda está em desenvolvimento.');
  };

  return (
    <DashboardLayout
      title="SGH - Meu Painel"
      subtitle="Acesso aos seus dados e serviços do hospital"
      userName={currentUser?.nome ?? 'Paciente'}
      onLogout={logout}
    >
      <AlertMessage message={error} type="error" />

      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Perfil</span>
            <h2>Meus Dados</h2>
            <p className="section-copy">Visualize seus dados cadastrais sem depender de renderização manual via string.</p>
          </div>
        </div>

        <PatientInfoCard patient={patient} isLoading={isLoading} hasError={Boolean(error)} />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Serviços</span>
            <h2>Serviços Disponíveis</h2>
            <p className="section-copy">Esses módulos já estão preparados como componentes e podem crescer daqui.</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} onClick={showDevMessage} />
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default PatientDashboard;
