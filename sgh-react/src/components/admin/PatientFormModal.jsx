import { useEffect, useState } from 'react';
import AlertMessage from '../ui/AlertMessage';

const emptyForm = {
  id: '',
  nome: '',
  email: '',
  cpf: '',
  telefone: '',
  genero: '',
  tipoSanguineo: '',
  dataNascimento: '',
};

const PatientFormModal = ({ isOpen, patient, isSaving, error, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (patient) {
      setFormData({
        id: patient.id ?? '',
        nome: patient.nome ?? '',
        email: patient.email ?? '',
        cpf: patient.cpf ?? '',
        telefone: patient.telefone ?? '',
        genero: patient.genero ?? '',
        tipoSanguineo: patient.tipoSanguineo ?? '',
        dataNascimento: patient.dataNascimento?.slice?.(0, 10) ?? '',
      });
      return;
    }

    setFormData(emptyForm);
  }, [patient, isOpen]);

  if (!isOpen) {
    return null;
  }

  const isEditMode = Boolean(patient);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal active" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditMode ? 'Editar Paciente' : 'Adicionar Paciente'}</h3>
          <button type="button" className="close-modal" onClick={onClose} aria-label="Fechar modal">
            x
          </button>
        </div>

        <AlertMessage message={error} type="error" />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="patientName">Nome Completo</label>
            <input
              id="patientName"
              name="nome"
              type="text"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patientEmail">Email</label>
            <input
              id="patientEmail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isEditMode}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patientCpf">CPF</label>
            <input
              id="patientCpf"
              name="cpf"
              type="text"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              disabled={isEditMode}
              required={!isEditMode}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patientPhone">Telefone</label>
              <input
                id="patientPhone"
                name="telefone"
                type="tel"
                value={formData.telefone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="patientGender">Gênero</label>
              <select id="patientGender" name="genero" value={formData.genero} onChange={handleChange} required>
                <option value="">Selecione</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="patientBirthDate">Data de Nascimento</label>
              <input
                id="patientBirthDate"
                name="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="patientBloodType">Tipo Sanguíneo</label>
              <select id="patientBloodType" name="tipoSanguineo" value={formData.tipoSanguineo} onChange={handleChange} required>
                <option value="">Selecione</option>
                <option value="A_POS">A+</option>
                <option value="A_NEG">A-</option>
                <option value="B_POS">B+</option>
                <option value="B_NEG">B-</option>
                <option value="AB_POS">AB+</option>
                <option value="AB_NEG">AB-</option>
                <option value="O_POS">O+</option>
                <option value="O_NEG">O-</option>
                <option value="DESCONHECIDO">Desconhecido</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;
