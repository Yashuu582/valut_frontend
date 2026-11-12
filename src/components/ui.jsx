import { ACCOUNT_STATUS_LABELS } from '../lib/format.js';

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

const STATUS_TONES = {
  ACTIVE: 'green',
  PENDING_APPROVAL: 'amber',
  REJECTED: 'red',
  FROZEN: 'blue',
  CLOSED: 'gray',
  SUSPENDED: 'red',
};

export function StatusBadge({ status, label }) {
  return (
    <span className={`badge badge-${STATUS_TONES[status] || 'gray'}`}>
      {label || ACCOUNT_STATUS_LABELS[status] || status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, tone }) {
  return (
    <div className={`stat-card ${tone ? `stat-${tone}` : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="pagination">
      <span className="muted">
        Page {page} of {pages} · {total} total
      </span>
      <div className="btn-row">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function Spinner({ small }) {
  return <span className={`spinner ${small ? 'spinner-sm' : ''}`} role="status" aria-label="Loading" />;
}
