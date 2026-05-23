import EmptyState from '../ui/EmptyState';
import LoadingState from '../ui/LoadingState';
import { formatDoctorRole, formatSex } from '../../utils/formatters';

const DoctorsTable = ({ doctors, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <LoadingState
        title="Carregando profissionais..."
        description="Buscando registros cadastrados no sistema."
      />
    );
  }

  if (!doctors.length) {
    return <EmptyState icon="+" message="Nenhum profissional cadastrado." />;
  }

  return (
    <div className="table-shell">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Função</th>
              <th>Especialidade</th>
              <th>CRM/COREN</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Sexo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id ?? doctor.email}>
                <td>{doctor.nome}</td>
                <td>{formatDoctorRole(doctor.role)}</td>
                <td>{doctor.especialidadePrincipal ?? '--'}</td>
                <td>{doctor.crmCoren}</td>
                <td>{doctor.email}</td>
                <td>{doctor.telefone}</td>
                <td>{formatSex(doctor.sexo)}</td>
                <td>
                  <div className="action-group">
                    <button type="button" className="action-btn btn-edit" onClick={() => onEdit(doctor)}>
                      Editar
                    </button>
                    <button type="button" className="action-btn btn-delete" onClick={() => onDelete(doctor)}>
                      Excluir
                    </button>
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

export default DoctorsTable;
