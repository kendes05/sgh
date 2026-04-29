const EmptyState = ({ icon = '!', message }) => (
  <div className="empty-state">
    <div className="empty-state-icon" aria-hidden="true">
      {icon}
    </div>
    <p>{message}</p>
  </div>
);

export default EmptyState;
