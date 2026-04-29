import { useEffect, useState } from 'react';
import AlertMessage from '../ui/AlertMessage';

const emptyForm = {
  id: '',
  nome: '',
  role: '',
  crm_coren: '',
  sexo: '',
  email: '',
  telefone: '',
  especialidadePrincipal: '',
};

const DoctorFormModal = ({ isOpen, doctor, isSaving, error, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (doctor) {
      setFormData({
        id: doctor.id ?? '',
        nome: doctor.nome ?? '',
        role: doctor.role ?? '',
        crm_coren: doctor.crm_coren ?? '',
        sexo: doctor.sexo ?? '',
        email: doctor.email ?? '',
        telefone: doctor.telefone ?? '',
        especialidadePrincipal: doctor.especialidadePrincipal ?? '',
      });
      return;
    }

    setFormData(emptyForm);
  }, [doctor, isOpen]);

  if (!isOpen) {
    return null;
  }

  const isEditMode = Boolean(doctor);

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
          <h3>{isEditMode ? 'Editar Profissional' : 'Adicionar Profissional'}</h3>
          <button type="button" className="close-modal" onClick={onClose} aria-label="Fechar modal">
            x
          </button>
        </div>

        <AlertMessage message={error} type="error" />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="doctorName">Nome Completo</label>
            <input id="doctorName" name="nome" type="text" value={formData.nome} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="doctorRole">Função</label>
              <select
                id="doctorRole"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isEditMode}
                required
              >
                <option value="">Selecione</option>
                <option value="medic">Médico(a)</option>
                <option value="nurse">Enfermeiro(a)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="doctorRegistry">CRM/COREN</label>
              <input
                id="doctorRegistry"
                name="crm_coren"
                type="text"
                value={formData.crm_coren}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="doctorEmail">Email</label>
              <input
                id="doctorEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isEditMode}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="doctorPhone">Telefone</label>
              <input
                id="doctorPhone"
                name="telefone"
                type="tel"
                value={formData.telefone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="doctorSex">Sexo</label>
              <select id="doctorSex" name="sexo" value={formData.sexo} onChange={handleChange} required>
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="doctorSpecialty">Especialidade Principal</label>
              <input
                id="doctorSpecialty"
                name="especialidadePrincipal"
                type="text"
                value={formData.especialidadePrincipal}
                onChange={handleChange}
                required
              />
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

export default DoctorFormModal;
