import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { searchPatientByEmail } from '../../services/api';
import StatusTab    from './tabs/StatusTab';
import ProntuarioTab from './tabs/ProntuarioTab';
import HistoricoTab from './tabs/HistoricoTab';
import PerfilTab    from './tabs/PerfilTab';

const TABS = [
  { id: 'status',      label: 'Meu status' },
  { id: 'prontuario',  label: 'Prontuário' },
  { id: 'historico',   label: 'Histórico' },
  { id: 'perfil',      label: 'Meu perfil' },
];

const PatientDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('status');

  // Perfil do paciente no patient-service (contém o patientId real)
  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError]     = useState('');

  useEffect(() => {
    if (!currentUser?.email) return;
    setProfileLoading(true);
    searchPatientByEmail(currentUser.email)
      .then((p) => setPatientProfile(p))
      .catch(() => setProfileError('Perfil de paciente não encontrado. Contacte a recepção.'))
      .finally(() => setProfileLoading(false));
  }, [currentUser]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="brand-mark">+</div>
          <span className="header-title">SGH</span>
        </div>
        <div className="header-user">
          <span className="header-username">{currentUser?.nome}</span>
          <span className="badge badge-patient">Paciente</span>
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
        {profileLoading ? (
          <div className="state-box"><span className="spinner--page" /></div>
        ) : profileError ? (
          <div className="state-box" style={{ color: 'var(--danger-text)' }}>{profileError}</div>
        ) : (
          <>
            {activeTab === 'status'     && <StatusTab     patientId={patientProfile.id} />}
            {activeTab === 'prontuario' && <ProntuarioTab patientId={patientProfile.id} />}
            {activeTab === 'historico'  && <HistoricoTab  patientId={patientProfile.id} />}
            {activeTab === 'perfil'     && <PerfilTab     patient={patientProfile} />}
          </>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;
