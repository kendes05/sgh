import { useEffect, useState } from 'react';
import { getAllDoctors, getAllUsers, getScreeningStats } from '../../../services/api';

const STATUS_LABELS = {
  AGUARDANDO_CLASSIFICACAO: 'Aguard. classificação',
  CLASSIFICADA: 'Classificada',
  AGUARDANDO_ATENDIMENTO: 'Aguard. atendimento',
  EM_ATENDIMENTO: 'Em atendimento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
  AUSENTE: 'Ausente',
};

const PRIORITY_LABELS = {
  VERMELHO: 'Vermelho',
  LARANJA: 'Laranja',
  AMARELO: 'Amarelo',
  VERDE: 'Verde',
  AZUL: 'Azul',
};

const ROLE_LABELS = { medic: 'Médico', nurse: 'Enfermeiro' };

const VisaoGeralTab = () => {
  const [doctors, setDoctors]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [docs, allUsers, screeningStats] = await Promise.all([
          getAllDoctors(),
          getAllUsers(),
          getScreeningStats(),
        ]);
        setDoctors(docs ?? []);
        setUsers(allUsers ?? []);
        setStats(screeningStats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const medics        = doctors.filter((d) => d.role?.toLowerCase() === 'medic' && d.isActive);
  const nurses        = doctors.filter((d) => d.role?.toLowerCase() === 'nurse' && d.isActive);
  const receptionists = users.filter((u) => u.role?.toLowerCase() === 'receptionist' && u.isActive);

  if (loading) return <div className="state-box"><span className="spinner--page" /></div>;
  if (error)   return <div className="state-box alert alert-error">{error}</div>;

  return (
    <div>
      {/* ── Equipe ───────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <div className="section-title">Equipe ativa</div>
          <div className="section-subtitle">Profissionais e recepcionistas com acesso ao sistema</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Médicos</div>
          <div className="stat-value">{medics.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Enfermeiros</div>
          <div className="stat-value">{nurses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Recepcionistas</div>
          <div className="stat-value">{receptionists.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total equipe</div>
          <div className="stat-value">{medics.length + nurses.length + receptionists.length}</div>
        </div>
      </div>

      {/* ── Profissionais ativos ──────────────────────────── */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Especialidade</th>
              <th>E-mail</th>
              <th>CRM / COREN</th>
            </tr>
          </thead>
          <tbody>
            {doctors.filter((d) => d.isActive).length === 0 ? (
              <tr><td colSpan={5} className="state-box">Nenhum profissional ativo.</td></tr>
            ) : (
              doctors
                .filter((d) => d.isActive)
                .map((d) => (
                  <tr key={d.id}>
                    <td>{d.nome}</td>
                    <td>
                      <span className={`badge badge-${d.role?.toLowerCase()}`}>
                        {ROLE_LABELS[d.role?.toLowerCase()] ?? d.role}
                      </span>
                    </td>
                    <td className="td-muted">{d.especialidadePrincipal}</td>
                    <td className="td-muted">{d.email}</td>
                    <td className="td-muted">{d.crmCoren}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Recepcionistas ────────────────────────────────── */}
      {receptionists.length > 0 && (
        <div className="table-card" style={{ marginBottom: 24 }}>
          <table>
            <thead>
              <tr>
                <th>Recepcionista</th>
                <th>E-mail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {receptionists.map((u) => (
                <tr key={u.id}>
                  <td>{u.nome}</td>
                  <td className="td-muted">{u.email}</td>
                  <td><span className="badge badge-active">Ativo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Triagem do dia ────────────────────────────────── */}
      {stats && (
        <>
          <div className="section-header" style={{ marginTop: 8 }}>
            <div>
              <div className="section-title">Triagem — hoje</div>
              <div className="section-subtitle">Resumo operacional do dia</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total de atendimentos</div>
              <div className="stat-value">{stats.totalHoje ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Tempo médio de espera</div>
              <div className="stat-value">{Math.round(stats.tempoMedioEsperaMinutos ?? 0)}</div>
              <div className="stat-sub">minutos</div>
            </div>
          </div>

          {stats.porStatus && Object.keys(stats.porStatus).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-subtitle" style={{ marginBottom: 8 }}>Por status</div>
              <div className="mini-stats">
                {Object.entries(stats.porStatus).map(([key, val]) => (
                  <div className="mini-stat" key={key}>
                    <strong>{val}</strong>
                    {STATUS_LABELS[key] ?? key}
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.porPrioridade && Object.keys(stats.porPrioridade).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="section-subtitle" style={{ marginBottom: 8 }}>Por prioridade</div>
              <div className="mini-stats">
                {Object.entries(stats.porPrioridade).map(([key, val]) => (
                  <div className="mini-stat" key={key}>
                    <strong>{val}</strong>
                    {PRIORITY_LABELS[key] ?? key}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisaoGeralTab;
