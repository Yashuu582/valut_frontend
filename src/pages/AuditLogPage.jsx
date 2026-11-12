import { Fragment, useEffect, useState } from 'react';
import { Alert, EmptyState, PageHeader, Pagination, Spinner } from '../components/ui.jsx';
import { ACTION_LABELS, dateTime } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';

function toIso(dateStr, endOfDay) {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return d.toISOString();
}

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const { data: actions } = useApi('/api/audit-logs/actions');
  const { data, error, loading } = useApi('/api/audit-logs', {
    action, actor, date_from: toIso(from), date_to: toIso(to, true), page, page_size: 25,
  });

  useEffect(() => {
    const t = setTimeout(() => { setActor(actorInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [actorInput]);

  const resetPage = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Append-only record of sign-ins, onboarding decisions and administrative changes."
      />
      <Alert>{error}</Alert>
      <section className="card">
        <div className="toolbar">
          <select value={action} onChange={resetPage(setAction)} aria-label="Filter by action">
            <option value="">All actions</option>
            {(actions || []).map((a) => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
          </select>
          <input className="search" type="search" placeholder="Actor email…" value={actorInput}
            onChange={(e) => setActorInput(e.target.value)} aria-label="Filter by actor" />
          <label className="inline-label">From <input type="date" value={from} onChange={resetPage(setFrom)} /></label>
          <label className="inline-label">To <input type="date" value={to} onChange={resetPage(setTo)} /></label>
        </div>

        {loading && !data ? (
          <div className="center-pad"><Spinner /></div>
        ) : data?.items.length === 0 ? (
          <EmptyState title="No audit events match these filters" />
        ) : (
          data && (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>IP</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((log) => (
                      <Fragment key={log.id}>
                        <tr>
                          <td className="muted nowrap">{dateTime(log.created_at)}</td>
                          <td>{log.actor_email || <span className="muted">System</span>}</td>
                          <td>
                            <span className="cell-main">{ACTION_LABELS[log.action] || log.action}</span>
                            <div className="muted small mono">{log.action}</div>
                          </td>
                          <td className="muted small mono">
                            {log.entity_type ? `${log.entity_type}:${log.entity_id?.slice(0, 8)}` : '—'}
                          </td>
                          <td className="muted small mono">{log.ip || '—'}</td>
                          <td>
                            {log.details && (
                              <button className="btn btn-ghost btn-sm"
                                onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                                {expanded === log.id ? 'Hide' : 'Details'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expanded === log.id && (
                          <tr className="details-row">
                            <td colSpan={6}>
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.page} pageSize={data.page_size} total={data.total} onChange={setPage} />
            </>
          )
        )}
      </section>
    </>
  );
}
