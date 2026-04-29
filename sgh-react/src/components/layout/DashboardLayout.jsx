const DashboardLayout = ({ title, subtitle, userName, children, onLogout }) => (
  <div className="page-shell dashboard-shell">
    <div className="container">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">+</div>
          <div>
            <h1>{title}</h1>
            <p className="header-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="user-info">
          <span className="user-pill">{userName}</span>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
