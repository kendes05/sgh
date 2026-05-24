import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PacientesTab from './tabs/PacientesTab';
import PerfilTab from './tabs/PerfilTab';

const TABS = [
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'perfil',    label: 'Meu perfil' },
];

const ReceptionistDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pacientes');

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-mark">+</div>
          <span className="header-title">SGH</span>
        </div>
        <div className="header-user">
          <span className="header-username">{currentUser?.nome}</span>
          <span className="badge badge-receptionist">Recepcionista</span>
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
        {activeTab === 'pacientes' && <PacientesTab />}
        {activeTab === 'perfil'    && <PerfilTab />}
      </main>
    </div>
  );
};

export default ReceptionistDashboard;
