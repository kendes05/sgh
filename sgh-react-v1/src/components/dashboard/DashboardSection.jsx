const DashboardSection = ({ kicker, title, copy, actions, children }) => (
  <section className="section">
    <div className="section-header">
      <div>
        {kicker ? <span className="section-kicker">{kicker}</span> : null}
        <h2>{title}</h2>
        {copy ? <p className="section-copy">{copy}</p> : null}
      </div>
      {actions ? <div className="toolbar-group">{actions}</div> : null}
    </div>
    {children}
  </section>
);

export default DashboardSection;
