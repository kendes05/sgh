const AuthShell = ({ children, title, description, metrics }) => (
  <div className="page-shell">
    <div className="container">
      <div className="auth-shell">
        <section className="hero-panel">
          <span className="hero-topline">Plataforma hospitalar</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="hero-metrics">
            {metrics.map((metric) => (
              <div className="hero-metric" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="auth-panel">{children}</section>
      </div>
    </div>
  </div>
);

export default AuthShell;
