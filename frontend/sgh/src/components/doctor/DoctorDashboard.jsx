import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorsByRole } from '../../services/api';
import AtendimentosTab from './tabs/AtendimentosTab';
import ProntuariosTab from './tabs/ProntuariosTab';
import PerfilTab from './tabs/PerfilTab';

const TABS = [
  { id: 'atendimentos', label: 'Atendimentos' },
  { id: 'prontuarios',  label: 'Prontuários' },
  { id: 'perfil',       label: 'Meu perfil' },
];

const DoctorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('atendimentos');
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    getDoctorsByRole('MEDIC')
      .then((doctors) => {
        const mine = doctors.find(
          (d) => d.email?.toLowerCase() === currentUser.email.toLowerCase(),
        );
        if (mine) setDoctorId(mine.id);
      })
      .catch(() => {});
  }, [currentUser]);

  const professionalId = doctorId ?? currentUser?.id;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-mark">+</div>
          <span className="header-title">SGH</span>
        </div>
        <div className="header-user">
          <span className="header-username">{currentUser?.nome}</span>
          <span className="badge badge-medic">Médico</span>
          <button className="btn-ghost" onClick={logout}>Sair</button>
        </div>
      </header>

      <nav className="dashboard-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {activeTab === 'atendimentos' && <AtendimentosTab doctorId={professionalId} />}
        {activeTab === 'prontuarios'  && <ProntuariosTab  doctorId={professionalId} />}
        {activeTab === 'perfil'       && <PerfilTab />}
      </main>
    </div>
  );
};

export default DoctorDashboard;
