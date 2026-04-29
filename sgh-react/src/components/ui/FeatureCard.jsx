const FeatureCard = ({ icon, title, description, badge = 'Em desenvolvimento', onClick }) => (
  <button type="button" className="feature-card" onClick={onClick}>
    <div className="feature-icon" aria-hidden="true">
      {icon}
    </div>
    <h3>{title}</h3>
    {description ? <p>{description}</p> : null}
    <span className="badge">{badge}</span>
  </button>
);

export default FeatureCard;
