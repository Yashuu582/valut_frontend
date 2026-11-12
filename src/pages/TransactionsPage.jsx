import { Fragment, useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Alert, EmptyState, PageHeader, Pagination, Spinner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import {
  ACCOUNT_TYPE_LABELS,
  dateTime,
  groupAccountNumber,
  isDebit,
  maskAccount,
  money,
  signedMoney,
  TXN_TYPE_LABELS,
} from '../lib/format.js';
import { useApi } from '../lib/useApi.js';

const AMOUNT_RE = /^\d{1,10}(\.\d{1,2})?$/;

function toIso(dateStr, endOfDay) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T${endOfDay ? '23:59:59.999' : '00:00:00'}`).toISOString();
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const oversight = user.role === 'ADMIN' || user.role === 'AUDITOR';
  const isHolder = user.role === 'ACCOUNT_HOLDER';

  const [filters, setFilters] = useState({
    account_id: '', type: '', from: '', to: '', owner: '', account_number: '', reference: '', min: '', max: '',
  });
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [notice, setNotice] = useState('');

  const typed = useDebounced({ owner: filters.owner, account_number: filters.account_number,
    reference: filters.reference, min: filters.min, max: filters.max });

  const { data: myAccounts } = useApi(isHolder ? '/api/accounts' : null);
  const { data, error, loading, reload } = useApi('/api/transactions', {
    account_id: filters.account_id,
    type: filters.type,
    date_from: toIso(filters.from),
    date_to: toIso(filters.to, true),
    ...(oversight ? {
      owner: typed.owner,
      account_number: typed.account_number.replace(/\s/g, ''),
      reference: typed.reference,
      min_amount: AMOUNT_RE.test(typed.min) ? typed.min : undefined,
      max_amount: AMOUNT_RE.test(typed.max) ? typed.max : undefined,
    } : {}),
    page,
    page_size: 25,
  });

  const set = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1); };
  const activeAccounts = (myAccounts || []).filter((a) => a.status === 'ACTIVE');
  const colSpan = oversight ? 8 : 7;

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={
          isHolder
            ? 'Every deposit, withdrawal and transfer on your accounts.'
            : user.role === 'AUDITOR'
              ? 'Read-only ledger of every transaction across all accounts.'
              : 'Ledger of every transaction across all accounts. Post deposits and withdrawals from Onboarding.'
        }
        actions={
          isHolder && !showTransfer && (
            <button className="btn btn-primary" onClick={() => { setShowTransfer(true); setNotice(''); }}
              disabled={activeAccounts.length === 0} title={activeAccounts.length ? '' : 'You need an active account'}>
              <Icon name="plus" size={16} /> New transfer
            </button>
          )
        }
      />

      {showTransfer && (
        <TransferForm
          accounts={activeAccounts}
          onCancel={() => setShowTransfer(false)}
          onDone={(res) => {
            setShowTransfer(false);
            setNotice(`Sent ${money(res.debit.amount, res.debit.currency)} — reference ${res.debit.reference}.`);
            reload();
          }}
        />
      )}
      <Alert kind="success">{notice}</Alert>
      <Alert>{error}</Alert>

      <section className="card">
        <div className="toolbar">
          {isHolder && (
            <select value={filters.account_id} onChange={set('account_id')} aria-label="Filter by account">
              <option value="">All my accounts</option>
              {(myAccounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname || ACCOUNT_TYPE_LABELS[a.type]} {maskAccount(a.account_number)}
                </option>
              ))}
            </select>
          )}
          {oversight && (
            <>
              <input className="search" type="search" placeholder="Owner name, email or username…"
                value={filters.owner} onChange={set('owner')} aria-label="Filter by owner" />
              <input type="search" placeholder="Account number" value={filters.account_number}
                onChange={set('account_number')} aria-label="Filter by account number" className="w-sm" />
              <input type="search" placeholder="Reference (TX…)" value={filters.reference}
                onChange={set('reference')} aria-label="Filter by reference" className="w-sm" />
            </>
          )}
          <select value={filters.type} onChange={set('type')} aria-label="Filter by type">
            <option value="">All types</option>
            {Object.entries(TXN_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="inline-label">From <input type="date" value={filters.from} onChange={set('from')} /></label>
          <label className="inline-label">To <input type="date" value={filters.to} onChange={set('to')} /></label>
          {oversight && (
            <>
              <input inputMode="decimal" placeholder="Min amount" value={filters.min} onChange={set('min')}
                aria-label="Minimum amount" className="w-xs" />
              <input inputMode="decimal" placeholder="Max amount" value={filters.max} onChange={set('max')}
                aria-label="Maximum amount" className="w-xs" />
            </>
          )}
        </div>

        {loading && !data ? (
          <div className="center-pad"><Spinner /></div>
        ) : data?.items.length === 0 ? (
          <EmptyState title="No transactions found">
            {isHolder ? 'Deposits posted to your accounts and transfers you make will appear here.' : 'Try clearing the filters.'}
          </EmptyState>
        ) : (
          data && (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      {oversight && <th>Owner</th>}
                      <th>Account</th>
                      <th>Type</th>
                      <th className="num">Amount</th>
                      <th className="num">Balance after</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((t) => (
                      <Fragment key={t.id}>
                        <tr>
                          <td className="muted nowrap">{dateTime(t.created_at)}</td>
                          <td className="mono small">{t.reference}</td>
                          {oversight && (
                            <td>
                              <div className="cell-main">{t.owner.full_name}</div>
                              <div className="muted small">{t.owner.email}</div>
                            </td>
                          )}
                          <td>
                            <div>{t.account.nickname || ACCOUNT_TYPE_LABELS[t.account.type]}</div>
                            <div className="muted small mono">{groupAccountNumber(t.account.account_number)}</div>
                          </td>
                          <td>
                            <span className={`badge ${isDebit(t.type) ? 'badge-red' : 'badge-green'}`}>
                              {TXN_TYPE_LABELS[t.type]}
                            </span>
                            {t.description && <div className="muted small">{t.description}</div>}
                          </td>
                          <td className={`num mono nowrap ${isDebit(t.type) ? 'amount-out' : 'amount-in'}`}>
                            {signedMoney(t)}
                          </td>
                          <td className="num mono nowrap">{money(t.balance_after, t.currency)}</td>
                          <td>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => setExpanded(expanded === t.id ? null : t.id)}>
                              {expanded === t.id ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>
                        {expanded === t.id && (
                          <tr className="details-row">
                            <td colSpan={colSpan}>
                              <TransactionDetails txn={t} oversight={oversight} />
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

function Detail({ label, children }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

function TransactionDetails({ txn: t, oversight }) {
  const person = (u) => (u ? `${u.full_name} (${u.username ? `@${u.username}, ` : ''}${u.email})` : null);
  return (
    <dl className="details-grid">
      <Detail label="Reference"><span className="mono">{t.reference}</span></Detail>
      <Detail label="Type">{TXN_TYPE_LABELS[t.type]}</Detail>
      <Detail label="Amount">{money(t.amount, t.currency)}</Detail>
      <Detail label="Balance after">{money(t.balance_after, t.currency)}</Detail>
      <Detail label="Date & time">{dateTime(t.created_at)}</Detail>
      <Detail label="Account"><span className="mono">{groupAccountNumber(t.account.account_number)}</span></Detail>
      {t.counterparty_account_number && (
        <Detail label={t.type === 'TRANSFER_OUT' ? 'Sent to' : 'Received from'}>
          <span className="mono">{groupAccountNumber(t.counterparty_account_number)}</span>
          {oversight && t.counterparty_owner && <span className="muted"> · {person(t.counterparty_owner)}</span>}
        </Detail>
      )}
      {t.transfer_id && <Detail label="Transfer ID"><span className="mono small">{t.transfer_id}</span></Detail>}
      <Detail label="Description">{t.description}</Detail>
      {oversight && <Detail label="Account owner">{person(t.owner)}</Detail>}
      {oversight && <Detail label="Initiated by">{person(t.initiated_by)}</Detail>}
    </dl>
  );
}

function TransferForm({ accounts, onDone, onCancel }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = accounts.find((a) => a.id === fromId);
  const toDigits = to.replace(/\s/g, '');
  const amountOk = AMOUNT_RE.test(amount) && Number(amount) > 0;
  const enough = from && amountOk && Number(amount) <= Number(from.balance);
  const canSubmit = from && /^\d{12}$/.test(toDigits) && amountOk && enough && !submitting;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api('/api/transactions/transfer', {
        method: 'POST',
        body: { from_account_id: fromId, to_account_number: toDigits, amount, description: description || null },
      });
      onDone(res);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>New transfer</h2>
          <p className="muted">Send money from one of your active accounts to any active account in the same currency.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="field-row">
          <div className="field">
            <label htmlFor="tf-from">From</label>
            <select id="tf-from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nickname || ACCOUNT_TYPE_LABELS[a.type]} {maskAccount(a.account_number)} — {money(a.balance, a.currency)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tf-to">To account number</label>
            <input id="tf-to" inputMode="numeric" placeholder="12 digits" value={to} maxLength={15}
              onChange={(e) => setTo(e.target.value)} className="mono" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="tf-amount">Amount {from && <span className="optional">({from.currency})</span>}</label>
            <input id="tf-amount" inputMode="decimal" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value.trim())} className="mono" />
            {amount && !amountOk && <span className="field-error">Enter a positive amount with up to 2 decimals</span>}
            {amountOk && from && !enough && <span className="field-error">More than the available {money(from.balance, from.currency)}</span>}
          </div>
          <div className="field">
            <label htmlFor="tf-desc">Description <span className="optional">optional</span></label>
            <input id="tf-desc" maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {submitting ? <Spinner small /> : `Send${amountOk && from ? ` ${money(amount, from.currency)}` : ''}`}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
