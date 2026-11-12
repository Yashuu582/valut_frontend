import { useState } from 'react';
import { Alert, EmptyState, PageHeader, Pagination, Spinner, StatusBadge } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { ACCOUNT_TYPE_LABELS, dateTime, groupAccountNumber, money } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';

const TABS = [
  { value: 'PENDING_APPROVAL', label: 'Pending review' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'FROZEN', label: 'Frozen' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
];

export default function AdminAccountsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [status, setStatus] = useState('PENDING_APPROVAL');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const { data, error, loading, reload } = useApi('/api/admin/accounts', { status, page, page_size: 20 });

  async function act(path, body, message) {
    setActionError('');
    setNotice('');
    try {
      await api(path, { method: 'POST', body });
      setNotice(message);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Onboarding & accounts"
        subtitle={isAdmin ? 'Review new account applications and manage account status.' : 'Read-only view of accounts and applications.'}
      />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={status === t.value}
            className={`tab ${status === t.value ? 'active' : ''}`}
            onClick={() => { setStatus(t.value); setPage(1); }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Alert kind="success">{notice}</Alert>
      <Alert>{actionError || error}</Alert>

      <section className="card">
        {loading && !data ? (
          <div className="center-pad"><Spinner /></div>
        ) : data?.items.length === 0 ? (
          <EmptyState title={status === 'PENDING_APPROVAL' ? 'All caught up' : 'No accounts here'}>
            {status === 'PENDING_APPROVAL' ? 'There are no applications waiting for review.' : null}
          </EmptyState>
        ) : (
          data && (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Account</th>
                      <th>Status</th>
                      <th className="num">Balance</th>
                      <th>{status === 'PENDING_APPROVAL' ? 'Applied' : 'Reviewed'}</th>
                      {isAdmin && <th className="actions-col">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((a) => (
                      <AccountRow key={a.id} account={a} isAdmin={isAdmin} act={act} />
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

function AccountRow({ account: a, isAdmin, act }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState(null); // 'deposit' | 'withdraw' | null
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const amountOk = /^\d{1,10}(\.\d{1,2})?$/.test(amount) && Number(amount) > 0;
  const label = groupAccountNumber(a.account_number);

  const run = async (path, body, msg) => {
    setBusy(true);
    await act(path, body, msg);
    setBusy(false);
  };

  return (
    <tr>
      <td>
        <div className="cell-main">{a.owner.full_name}</div>
        <div className="muted small">{a.owner.email}</div>
      </td>
      <td>
        <div>{a.nickname || ACCOUNT_TYPE_LABELS[a.type]} · {a.currency}</div>
        <div className="muted small mono">{label}</div>
      </td>
      <td>
        <StatusBadge status={a.status} />
        {a.review_note && <div className="muted small">“{a.review_note}”</div>}
      </td>
      <td className="num mono">{money(a.balance, a.currency)}</td>
      <td className="muted">
        {a.status === 'PENDING_APPROVAL' ? dateTime(a.created_at) : dateTime(a.reviewed_at)}
        {a.reviewed_by && <div className="small">by {a.reviewed_by.full_name}</div>}
      </td>
      {isAdmin && (
        <td className="actions-col">
          {a.status === 'PENDING_APPROVAL' && !rejecting && (
            <div className="btn-row">
              <button className="btn btn-success btn-sm" disabled={busy}
                onClick={() => run(`/api/admin/accounts/${a.id}/review`, { decision: 'approve' }, `Approved account ${label}.`)}>
                Approve
              </button>
              <button className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={() => setRejecting(true)}>
                Reject
              </button>
            </div>
          )}
          {rejecting && (
            <form className="inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(`/api/admin/accounts/${a.id}/review`, { decision: 'reject', note }, `Rejected application ${label}.`);
              }}>
              <input autoFocus placeholder="Reason (shown to applicant)" value={note} maxLength={500}
                onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-danger btn-sm" disabled={!note.trim() || busy}>Confirm</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)}>Cancel</button>
            </form>
          )}
          {a.status === 'ACTIVE' && !moving && (
            <div className="btn-row">
              <button className="btn btn-success btn-sm" disabled={busy} onClick={() => setMoving('deposit')}>
                Deposit
              </button>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setMoving('withdraw')}>
                Withdraw
              </button>
              <button className="btn btn-ghost btn-sm" disabled={busy}
                onClick={() => run(`/api/admin/accounts/${a.id}/freeze`, undefined, `Froze account ${label}.`)}>
                Freeze
              </button>
            </div>
          )}
          {moving && (
            <form className="inline-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const verb = moving === 'deposit' ? 'Deposited' : 'Withdrew';
                await run(`/api/admin/accounts/${a.id}/${moving}`,
                  { amount, description: memo || null },
                  `${verb} ${money(amount, a.currency)} ${moving === 'deposit' ? 'to' : 'from'} ${label}.`);
                setMoving(null); setAmount(''); setMemo('');
              }}>
              <input autoFocus inputMode="decimal" placeholder={`Amount (${a.currency})`} value={amount}
                onChange={(e) => setAmount(e.target.value.trim())} className="w-xs mono" />
              <input placeholder="Description (optional)" value={memo} maxLength={200}
                onChange={(e) => setMemo(e.target.value)} />
              <button className={`btn btn-sm ${moving === 'deposit' ? 'btn-success' : 'btn-danger'}`}
                disabled={!amountOk || busy}>
                {moving === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMoving(null)}>Cancel</button>
            </form>
          )}
          {a.status === 'FROZEN' && (
            <button className="btn btn-ghost btn-sm" disabled={busy}
              onClick={() => run(`/api/admin/accounts/${a.id}/unfreeze`, undefined, `Unfroze account ${label}.`)}>
              Unfreeze
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
