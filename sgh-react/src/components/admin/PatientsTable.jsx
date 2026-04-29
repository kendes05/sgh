import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import { formatBirthDate, formatGender } from '../../utils/formatters';

const PatientsTable = ({ patients, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return <LoadingState title="Carregando pacientes..." description="Buscando registros cadastrados no sistema." />;
  }

  if (!patients.length) {
    return <EmptyState icon="+" message="Nenhum paciente cadastrado." />;
  }

  return (
    <div className="table-shell">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Data Nascimento</th>
              <th>Gênero</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id ?? patient.email}>
                <td>{patient.nome}</td>
                <td>{patient.email}</td>
                <td>{patient.telefone}</td>
                <td>{formatBirthDate(patient.dataNascimento)}</td>
                <td>{formatGender(patient.genero)}</td>
                <td>
                  <span className={`status-pill ${patient.isActive ? 'active' : 'inactive'}`}>
                    {patient.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="action-group">
                    <button type="button" className="action-btn btn-edit" onClick={() => onEdit(patient)}>
                      Editar
                    </button>
                    {patient.isActive ? (
                      <button type="button" className="action-btn btn-delete" onClick={() => onDelete(patient)}>
                        Desativar
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientsTable;
