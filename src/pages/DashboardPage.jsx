import { Link } from 'react-router-dom';
import ActivityList from '../components/ActivityList.jsx';
import Icon from '../components/Icon.jsx';
import { Alert, EmptyState, PageHeader, Spinner, StatCard, StatusBadge } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import { ACCOUNT_TYPE_LABELS, dateTime, isDebit, maskAccount, money, signedMoney, TXN_TYPE_LABELS } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user.full_name.split(' ')[0];
  return user.role === 'ACCOUNT_HOLDER' ? (
    <HolderDashboard name={firstName} />
  ) : (
    <OversightDashboard name={firstName} isAdmin={user.role === 'ADMIN'} />
  );
}

function totalsByCurrency(accounts) {
  const totals = {};
  for (const a of accounts) {
    if (a.status === 'ACTIVE') totals[a.currency] = (totals[a.currency] || 0) + Number(a.balance);
  }
  return totals;
}

function HolderDashboard({ name }) {
  const { data: accounts, error, loading } = useApi('/api/accounts');

  if (loading) return <div className="center-pad"><Spinner /></div>;
  if (error) return <Alert>{error}</Alert>;

  const totals = totalsByCurrency(accounts);
  const currencies = Object.keys(totals);
  const active = accounts.filter((a) => a.status === 'ACTIVE').length;
  const pending = accounts.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        subtitle="Here's an overview of your accounts."
        actions={
          <Link to="/accounts" className="btn btn-primary">
            <Icon name="plus" size={16} /> Open an account
          </Link>
        }
      />
      <div className="stats">
        <StatCard
          label="Available balance"
          value={currencies.length ? money(totals[currencies[0]], currencies[0]) : money(0)}
          hint={currencies.length > 1 ? `+ ${currencies.slice(1).map((c) => money(totals[c], c)).join(', ')}` : 'Across active accounts'}
          tone="accent"
        />
        <StatCard label="Active accounts" value={active} />
        <StatCard label="Applications in review" value={pending} hint={pending ? 'Usually reviewed within 1 business day' : undefined} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Your accounts</h2>
          <Link to="/accounts" className="link">Manage</Link>
        </div>
        {accounts.length === 0 ? (
          <EmptyState title="You don't have any accounts yet">
            <Link to="/accounts">Apply for your first account</Link> — it only takes a minute.
          </EmptyState>
        ) : (
          <div className="account-grid">
            {accounts.slice(0, 6).map((a) => (
              <div key={a.id} className={`account-tile account-${a.status.toLowerCase()}`}>
                <div className="account-tile-top">
                  <span className="account-type">{ACCOUNT_TYPE_LABELS[a.type]}</span>
                  <StatusBadge status={a.status} />
                </div>
                <span className="account-name">{a.nickname || `${ACCOUNT_TYPE_LABELS[a.type]} account`}</span>
                <span className="account-balance">{money(a.balance, a.currency)}</span>
                <span className="muted small mono">{maskAccount(a.account_number)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <RecentTransactions />
    </>
  );
}

function RecentTransactions() {
  const { data } = useApi('/api/transactions', { page_size: 6 });
  if (!data || data.items.length === 0) return null;
  return (
    <section className="card">
      <div className="card-head">
        <h2>Recent transactions</h2>
        <Link to="/transactions" className="link">View all</Link>
      </div>
      <ul className="activity">
        {data.items.map((t) => (
          <li key={t.id} className="txn-row">
            <div className="activity-body">
              <span>
                <strong>{TXN_TYPE_LABELS[t.type]}</strong>
                {t.description && <span className="muted"> · {t.description}</span>}
              </span>
              <time className="muted small">
                {dateTime(t.created_at)} · {maskAccount(t.account.account_number)}
              </time>
            </div>
            <span className={`mono nowrap ${isDebit(t.type) ? 'amount-out' : 'amount-in'}`}>{signedMoney(t)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OversightDashboard({ name, isAdmin }) {
  const { data: stats, error, loading } = useApi('/api/admin/stats');

  if (loading) return <div className="center-pad"><Spinner /></div>;
  if (error) return <Alert>{error}</Alert>;

  const staff = stats.users_by_role.ADMIN + stats.users_by_role.AUDITOR;
  const balances = Object.entries(stats.total_active_balance);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${name}`}
        subtitle={isAdmin ? 'Operations overview and items that need your attention.' : 'Read-only oversight of platform activity.'}
        actions={
          isAdmin && stats.pending_applications > 0 ? (
            <Link to="/admin/accounts" className="btn btn-primary">
              Review {stats.pending_applications} application{stats.pending_applications === 1 ? '' : 's'}
            </Link>
          ) : null
        }
      />
      <div className="stats">
        <StatCard label="Pending applications" value={stats.pending_applications} tone={stats.pending_applications ? 'warn' : undefined} />
        <StatCard label="Active accounts" value={stats.accounts_by_status.ACTIVE} hint={`${stats.accounts_by_status.FROZEN} frozen`} />
        <StatCard label="Account holders" value={stats.users_by_role.ACCOUNT_HOLDER} hint={`${staff} staff users`} />
        <StatCard label="Transactions" value={stats.transactions_total} hint={`${stats.transactions_last_24h} in the last 24 hours`} />
        <StatCard
          label="Funds under management"
          value={balances.length ? money(balances[0][1], balances[0][0]) : money(0)}
          hint={balances.length > 1 ? `+ ${balances.length - 1} other currenc${balances.length === 2 ? 'y' : 'ies'}` : 'Active accounts'}
          tone="accent"
        />
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h2>Accounts by status</h2>
          </div>
          <StatusBars counts={stats.accounts_by_status} />
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Recent activity</h2>
            <Link to="/audit" className="link">Full audit log</Link>
          </div>
          <ActivityList items={stats.recent_activity} />
        </section>
      </div>
    </>
  );
}

function StatusBars({ counts }) {
  const entries = Object.entries(counts);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <ul className="bars">
      {entries.map(([status, n]) => (
        <li key={status}>
          <StatusBadge status={status} />
          <div className="bar-track">
            <div className={`bar-fill bar-${status.toLowerCase()}`} style={{ width: `${(n / max) * 100}%` }} />
          </div>
          <span className="bar-value">{n}</span>
        </li>
      ))}
    </ul>
  );
}
