import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import VisaoGeralTab from './tabs/VisaoGeralTab';
import ProfissionaisTab from './tabs/ProfissionaisTab';
import RecepcionistasTab from './tabs/RecepcionistasTab';
import PerfilTab from './tabs/PerfilTab';

const TABS = [
  { id: 'visao-geral',     label: 'Visão geral' },
  { id: 'profissionais',   label: 'Profissionais' },
  { id: 'recepcionistas',  label: 'Recepcionistas' },
  { id: 'perfil',          label: 'Meu perfil' },
];

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('visao-geral');

  const renderTab = () => {
    switch (activeTab) {
      case 'visao-geral':    return <VisaoGeralTab />;
      case 'profissionais':  return <ProfissionaisTab />;
      case 'recepcionistas': return <RecepcionistasTab />;
      case 'perfil':         return <PerfilTab />;
      default:               return null;
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-mark">+</div>
          <span className="header-title">SGH</span>
        </div>
        <div className="header-user">
          <span className="header-username">{currentUser?.nome}</span>
          <span className="badge badge-admin">Admin</span>
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

      <main className="dashboard-content">{renderTab()}</main>
    </div>
  );
};

export default AdminDashboard;
