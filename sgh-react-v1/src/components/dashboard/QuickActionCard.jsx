const QuickActionCard = ({ icon, title, description, badge, onClick }) => (
  <button type="button" className="feature-card quick-action-card" onClick={onClick}>
    <div className="feature-icon" aria-hidden="true">
      {icon}
    </div>
    <h3>{title}</h3>
    {description ? <p>{description}</p> : null}
    {badge ? <span className="badge">{badge}</span> : null}
  </button>
);

export default QuickActionCard;
