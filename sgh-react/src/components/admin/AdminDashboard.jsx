import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatient, deletePatient, getAllPatients, updatePatient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../layout/DashboardLayout';
import AlertMessage from '../ui/AlertMessage';
import FeatureCard from '../ui/FeatureCard';
import PatientsTable from './PatientsTable';
import PatientFormModal from './PatientFormModal';

const featureCards = [
  {
    icon: 'MD',
    title: 'Gerenciamento de Profissional',
    description: 'Acesse o CRUD da equipe clínica e mantenha os cadastros sempre atualizados.',
    badge: 'Disponível',
    action: 'doctor-management',
  },
  {
    icon: 'AD',
    title: 'Gerenciamento de Administrador',
    description: 'Estrutura reservada para ampliar o gerenciamento interno do sistema.',
  },
  {
    icon: 'PR',
    title: 'Prontuários',
    description: 'Área pensada para consolidar histórico clínico e documentos.',
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: 'info' });
  const [modalError, setModalError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPatients();
      setPatients(data);
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Total de Pacientes',
        value: patients.length,
        caption: 'Registros disponíveis no sistema',
        className: '',
      },
      {
        label: 'Pacientes Ativos',
        value: patients.filter((patient) => patient.isActive).length,
        caption: 'Cadastros com acesso habilitado',
        className: 'success',
      },
      {
        label: 'Funcionalidades',
        value: 3,
        caption: 'Módulos mapeados para expansão',
        className: 'warning',
      },
    ],
    [patients],
  );

  const openCreateModal = () => {
    setSelectedPatient(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
    setModalError('');
  };

  const handleSubmitPatient = async (formData) => {
    try {
      setIsSaving(true);
      setModalError('');

      const payload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        genero: formData.genero,
        dataNascimento: formData.dataNascimento,
      };

      if (selectedPatient?.id) {
        await updatePatient(selectedPatient.id, payload);
        setFeedback({ message: 'Paciente atualizado com sucesso!', type: 'success' });
      } else {
        await createPatient(payload);
        setFeedback({
          message: 'Paciente cadastrado com sucesso! Um email com a senha foi enviado.',
          type: 'success',
        });
      }

      closeModal();
      await loadPatients();
    } catch (error) {
      setModalError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePatient = async (patient) => {
    const confirmed = window.confirm(`Deseja realmente desativar o paciente ${patient.nome}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deletePatient(patient.email);
      setFeedback({ message: 'Paciente desativado com sucesso!', type: 'success' });
      await loadPatients();
    } catch (error) {
      setFeedback({ message: error.message, type: 'error' });
    }
  };

  const handleFeatureCardClick = (feature) => {
    if (feature.action === 'doctor-management') {
      navigate('/admin/profissionais');
      return;
    }

    window.alert('Funcionalidade em desenvolvimento.\n\nEla vai aparecer por aqui em breve.');
  };

  return (
    <DashboardLayout
      title="SGH - Painel Administrativo"
      subtitle="Controle de pacientes e visão geral operacional"
      userName={currentUser?.nome ?? 'Administrador'}
      onLogout={logout}
    >
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
            <span className="section-kicker">Pacientes</span>
            <h2>Gerenciar Pacientes</h2>
            <p className="section-copy">Cadastre, atualize e acompanhe o status dos pacientes em um só lugar.</p>
          </div>

          <button type="button" className="btn btn-inline" onClick={openCreateModal}>
            + Adicionar Paciente
          </button>
        </div>

        <PatientsTable
          patients={patients}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={handleDeletePatient}
        />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-kicker">Expansão</span>
            <h2>Outras Funcionalidades</h2>
            <p className="section-copy">A base já está pronta para crescer sem voltar ao HTML monolítico.</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} onClick={() => handleFeatureCardClick(feature)} />
          ))}
        </div>
      </section>

      <PatientFormModal
        isOpen={isModalOpen}
        patient={selectedPatient}
        isSaving={isSaving}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmitPatient}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
