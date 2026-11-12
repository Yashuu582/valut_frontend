import { ACTION_LABELS, dateTime } from '../lib/format.js';

const TONE = (action) =>
  action.includes('failed') || action.includes('reuse') || action.includes('blocked') || action.includes('rejected')
    ? 'red'
    : action.includes('approved') || action === 'auth.register'
      ? 'green'
      : action.includes('frozen')
        ? 'blue'
        : 'gray';

export default function ActivityList({ items }) {
  if (!items?.length) return <p className="muted">No activity recorded yet.</p>;
  return (
    <ul className="activity">
      {items.map((log) => (
        <li key={log.id}>
          <span className={`dot dot-${TONE(log.action)}`} />
          <div className="activity-body">
            <span>
              <strong>{log.actor_email || 'System'}</strong> · {ACTION_LABELS[log.action] || log.action}
              {log.details?.account_number && <span className="muted"> (#{log.details.account_number.slice(-4)})</span>}
              {log.details?.email && log.action.startsWith('user.') && (
                <span className="muted"> → {log.details.email}</span>
              )}
            </span>
            <time className="muted small">{dateTime(log.created_at)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}
