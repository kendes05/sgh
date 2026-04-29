const LoadingState = ({ title = 'Carregando...', description }) => (
  <div className="loading">
    <div className="spinner" />
    <p className="loading-title">{title}</p>
    {description ? <p className="loading-copy">{description}</p> : null}
  </div>
);

export default LoadingState;
