import { useEffect, useMemo, useState } from 'react';
import { getActivePatientScreening, getMedicalRecordByPatientId, getPatientByEmail } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import DashboardSection from './DashboardSection';
import QuickActionCard from './QuickActionCard';
import { calculateAge, formatBirthDate, formatGender } from '../../utils/formatters';

const PatientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [patient, setPatient] = useState(null);
  const [activeScreening, setActiveScreening] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError('');

        const patientList = await getPatientByEmail(currentUser.email);
        const patientData = Array.isArray(patientList) ? patientList[0] : patientList;
        if (!patientData) throw new Error('Perfil de paciente nao encontrado.');
        setPatient(patientData);

        const [screeningResult, medicalRecordResult] = await Promise.allSettled([
          getActivePatientScreening(patientData.id),
          getMedicalRecordByPatientId(patientData.id),
        ]);

        setActiveScreening(screeningResult.status === 'fulfilled' ? screeningResult.value : null);
        setMedicalRecord(medicalRecordResult.status === 'fulfilled' ? medicalRecordResult.value : null);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.email) {
      loadDashboard();
    }
  }, [currentUser]);

  const queueMetrics = activeScreening?.queueMetrics;

  const stats = useMemo(
    () => [
      {
        label: 'Triagem ativa',
        value: activeScreening ? 'Sim' : 'Nao',
        caption: activeScreening?.status || 'Nenhuma triagem em andamento',
      },
      {
        label: 'Posicao na fila',
        value: queueMetrics?.queuePosition ?? '--',
        caption: 'Atualizada a partir da triagem ativa',
        className: 'success',
      },
      {
        label: 'Espera estimada',
        value: queueMetrics?.remainingMinutes ? `${queueMetrics.remainingMinutes} min` : '--',
        caption: 'Tempo previsto para o atendimento',
        className: 'warning',
      },
    ],
    [activeScreening, queueMetrics],
  );

  return (
    <DashboardLayout
      title="SGH - Dashboard do Paciente"
      subtitle="Seu perfil e o acompanhamento da sua jornada no hospital"
      userName={currentUser?.nome ?? 'Paciente'}
      onLogout={logout}
    >
      <AlertMessage message={error} type="error" />

      {isLoading ? (
        <LoadingState title="Carregando seu painel..." description="Buscando perfil, triagem ativa e acesso ao prontuario." />
      ) : !patient ? (
        <EmptyState icon="!" message="Nao foi possivel localizar o perfil do paciente." />
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
            kicker="Perfil"
            title="Dados do paciente"
            copy="Resumo cadastral principal, conforme o ponto 2.4 do documento."
          >
            <div className="patient-info">
              <div className="info-item">
                <div className="info-label">Nome completo</div>
                <div className="info-value">{patient.nome}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Email</div>
                <div className="info-value">{patient.email}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Telefone</div>
                <div className="info-value">{patient.telefone || '--'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Nascimento</div>
                <div className="info-value">
                  {formatBirthDate(patient.dataNascimento)} ({calculateAge(patient.dataNascimento)} anos)
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Genero</div>
                <div className="info-value">{formatGender(patient.genero)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Status do cadastro</div>
                <div className="info-value">{patient.isActive ? 'Ativo' : 'Inativo'}</div>
              </div>
            </div>
          </DashboardSection>

          <DashboardSection
            kicker="Triagem"
            title="Acompanhamento da triagem ativa"
            copy="Quando existir triagem aberta, o painel mostra status, fila e tempo estimado."
          >
            {activeScreening ? (
              <div className="patient-info">
                <div className="info-item">
                  <div className="info-label">Status atual</div>
                  <div className="info-value">{activeScreening.status}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Queixa principal</div>
                  <div className="info-value">{activeScreening.mainComplaint || '--'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Posicao na fila</div>
                  <div className="info-value">{queueMetrics?.queuePosition ?? '--'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Espera estimada</div>
                  <div className="info-value">{queueMetrics?.remainingMinutes ?? '--'} min</div>
                </div>
              </div>
            ) : (
              <EmptyState icon="+" message="Voce nao possui triagem ativa no momento." />
            )}
          </DashboardSection>

          <DashboardSection
            kicker="Atalho"
            title="Prontuario"
            copy="O acesso ao prontuario fica destacado no dashboard do paciente, conforme o MVP."
          >
            <div className="dashboard-grid">
              <QuickActionCard
                icon="PR"
                title="Visualizar prontuario"
                description={
                  medicalRecord
                    ? 'Seu prontuario foi localizado e o acesso sera conectado na proxima etapa do MVP.'
                    : 'O prontuario ainda nao foi localizado para este paciente.'
                }
                badge={medicalRecord ? 'Preparado' : 'Pendente'}
                onClick={() => window.alert('A tela de prontuario sera implementada na etapa dedicada a esse modulo.')}
              />
            </div>
          </DashboardSection>
        </>
      )}
    </DashboardLayout>
  );
};

export default PatientDashboard;
