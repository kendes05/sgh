import LoadingState from '../ui/LoadingState';
import EmptyState from '../ui/EmptyState';
import { calculateAge, formatBirthDate, formatGender } from '../../utils/formatters';

const PatientInfoCard = ({ patient, isLoading, hasError }) => {
  if (isLoading) {
    return <LoadingState title="Carregando informações..." description="Buscando seus dados cadastrais." />;
  }

  if (hasError || !patient) {
    return <EmptyState icon="!" message="Não foi possível carregar suas informações." />;
  }

  return (
    <div className="patient-card">
      <h3>Informações Pessoais</h3>
      <div className="patient-info">
        <div className="info-item">
          <div className="info-label">Nome Completo</div>
          <div className="info-value">{patient.nome}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Email</div>
          <div className="info-value">{patient.email}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Telefone</div>
          <div className="info-value">{patient.telefone}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Data de Nascimento</div>
          <div className="info-value">
            {formatBirthDate(patient.dataNascimento)} ({calculateAge(patient.dataNascimento)} anos)
          </div>
        </div>
        <div className="info-item">
          <div className="info-label">Gênero</div>
          <div className="info-value">{formatGender(patient.genero)}</div>
        </div>
        <div className="info-item">
          <div className="info-label">Status</div>
          <div className="info-value">{patient.isActive ? 'Ativo' : 'Inativo'}</div>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoCard;
