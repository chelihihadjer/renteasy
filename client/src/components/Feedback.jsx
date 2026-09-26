export function Loader({ label = 'Chargement…' }) {
  return (
    <div className="loader" role="status">
      <span className="loader-dot" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
