import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDoctor, deleteDoctor, getAllDoctors, updateDoctor } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import DoctorFormModal from './DoctorFormModal';
import DoctorsTable from './DoctorsTable';

const DoctorManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [modalError, setModalError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const data = await getAllDoctors();
      setDoctors(data);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Total de Profissionais',
        value: doctors.length,
        caption: 'Cadastros disponíveis na equipe clínica',
        className: '',
      },
      {
        label: 'Médicos',
        value: doctors.filter((doctor) => doctor.role === 'medic').length,
        caption: 'Profissionais com perfil médico',
        className: 'success',
      },
      {
        label: 'Enfermeiros',
        value: doctors.filter((doctor) => doctor.role === 'nurse').length,
        caption: 'Profissionais com perfil de enfermagem',
        className: 'warning',
      },
    ],
    [doctors],
  );

  const openCreateModal = () => {
    setSelectedDoctor(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setModalError('');
    setIsModalOpen(false);
  };

  const handleSubmitDoctor = async (formData) => {
    try {
      setIsSaving(true);
      setModalError('');

      const payload = {
        nome: formData.nome,
        role: formData.role,
        crm_coren: formData.crm_coren,
        sexo: formData.sexo,
        email: formData.email,
        telefone: formData.telefone,
        especialidadePrincipal: formData.especialidadePrincipal,
      };

      if (selectedDoctor?.id) {
        await updateDoctor(selectedDoctor.id, payload);
        setFeedback({ message: 'Profissional atualizado com sucesso!', type: 'success' });
      } else {
        await createDoctor(payload);
        setFeedback({
          message: 'Profissional cadastrado com sucesso! Um email com a senha foi enviado.',
          type: 'success',
        });
      }

      closeModal();
      await loadDoctors();
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDoctor = async (doctor) => {
    const confirmed = window.confirm(`Deseja realmente excluir o profissional ${doctor.nome}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoctor(doctor.id);
      setFeedback({ message: 'Profissional removido com sucesso!', type: 'success' });
      await loadDoctors();
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    }
  };

  return (
    <DashboardLayout
      title="SGH - Profissionais da Saúde"
      subtitle="Cadastro e manutenção da equipe clínica"
      userName={currentUser?.nome ?? 'Administrador'}
      onLogout={logout}
    >
      <div className="page-toolbar">
        <button type="button" className="btn btn-secondary btn-inline" onClick={() => navigate('/admin')}>
          Voltar ao painel
        </button>
      </div>

      <AlertMessage message={feedback.message} type={feedback.type} />

      <div className="dashboard-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.className}`.trim()}>
            <h3>{stat.label}</h3>
            <div className="stat-value">{stat.value}</div>
            <p className="stat-caption">{stat.caption}</p>
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Equipe clínica</span>
            <h2>Gerenciar Profissionais</h2>
            <p className="section-copy">
              Cadastre, edite e remova profissionais da saúde em um fluxo conectado ao doctor-service.
            </p>
          </div>

          <button type="button" className="btn btn-inline" onClick={openCreateModal}>
            + Adicionar Profissional
          </button>
        </div>

        <DoctorsTable
          doctors={doctors}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={handleDeleteDoctor}
        />
      </section>

      <DoctorFormModal
        isOpen={isModalOpen}
        doctor={selectedDoctor}
        isSaving={isSaving}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmitDoctor}
      />
    </DashboardLayout>
  );
};

export default DoctorManagementPage;
