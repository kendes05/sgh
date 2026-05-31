import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDoctorsByRole } from '../../services/api';
import TriagemTab from './tabs/TriagemTab';
import ProntuariosTab from './tabs/ProntuariosTab';
import PerfilTab from './tabs/PerfilTab';

const TABS = [
  { id: 'triagem',      label: 'Triagem' },
  { id: 'prontuarios', label: 'Prontuários' },
  { id: 'perfil',      label: 'Meu perfil' },
];

const NurseDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('triagem');
  const [nurseId, setNurseId] = useState(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    getDoctorsByRole('NURSE')
      .then((nurses) => {
        const mine = nurses.find(
          (n) => n.email?.toLowerCase() === currentUser.email.toLowerCase(),
        );
        if (mine) setNurseId(mine.id);
      })
      .catch(() => {});
  }, [currentUser]);

  const professionalId = nurseId ?? currentUser?.id;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-mark">+</div>
          <span className="header-title">SGH</span>
        </div>
        <div className="header-user">
          <span className="header-username">{currentUser?.nome}</span>
          <span className="badge badge-nurse">Enfermeiro</span>
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
        {activeTab === 'triagem'      && <TriagemTab nurseId={professionalId} />}
        {activeTab === 'prontuarios' && <ProntuariosTab />}
        {activeTab === 'perfil'      && <PerfilTab />}
      </main>
    </div>
  );
};

export default NurseDashboard;
