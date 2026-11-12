import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Alert, PageHeader, Spinner, StatusBadge } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { ACCOUNT_TYPE_LABELS, dateTime, groupAccountNumber, money } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';

const TYPES = [
  { value: 'CHECKING', title: 'Checking', text: 'Everyday spending and payments.' },
  { value: 'SAVINGS', title: 'Savings', text: 'Set money aside and grow it.' },
  { value: 'BUSINESS', title: 'Business', text: 'Separate your business finances.' },
];

export default function AccountsPage() {
  const { data: accounts, error, loading, reload } = useApi('/api/accounts');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading && !accounts) return <div className="center-pad"><Spinner /></div>;
  if (error) return <Alert>{error}</Alert>;

  const isNew = accounts.length === 0;
  const formOpen = showForm || isNew;

  return (
    <>
      <PageHeader
        title="My accounts"
        subtitle="View your accounts and apply for new ones."
        actions={
          !formOpen && (
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setNotice(''); }}>
              <Icon name="plus" size={16} /> New application
            </button>
          )
        }
      />
      <Alert kind="success">{notice}</Alert>

      {formOpen && (
        <ApplicationForm
          intro={isNew}
          onCancel={isNew ? null : () => setShowForm(false)}
          onCreated={(acct) => {
            setShowForm(false);
            setNotice(`Application submitted for account ${groupAccountNumber(acct.account_number)}. We'll review it shortly.`);
            reload();
          }}
        />
      )}

      {!isNew && (
        <section className="card">
          <div className="card-head">
            <h2>Accounts & applications</h2>
          </div>
          {(
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="num">Balance</th>
                    <th>Opened / applied</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="cell-main">{a.nickname || `${ACCOUNT_TYPE_LABELS[a.type]} account`}</div>
                        <div className="muted small mono">{groupAccountNumber(a.account_number)}</div>
                      </td>
                      <td>{ACCOUNT_TYPE_LABELS[a.type]} · {a.currency}</td>
                      <td>
                        <StatusBadge status={a.status} />
                        {a.status === 'REJECTED' && a.review_note && (
                          <div className="muted small">Reason: {a.review_note}</div>
                        )}
                      </td>
                      <td className="num mono">{money(a.balance, a.currency)}</td>
                      <td className="muted">{dateTime(a.reviewed_at || a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function ApplicationForm({ intro, onCreated, onCancel }) {
  const [type, setType] = useState('CHECKING');
  const [currency, setCurrency] = useState('USD');
  const [nickname, setNickname] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const acct = await api('/api/accounts', { method: 'POST', body: { type, currency, nickname: nickname || null } });
      onCreated(acct);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <div className="card-head">
        <div>
          {intro && <span className="eyebrow">Step 2 of 2</span>}
          <h2>{intro ? 'Apply for your first account' : 'New account application'}</h2>
          <p className="muted">An administrator reviews every application before the account becomes active.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <Alert>{error}</Alert>
        <fieldset className="choice-grid">
          <legend>Account type</legend>
          {TYPES.map((t) => (
            <label key={t.value} className={`choice ${type === t.value ? 'selected' : ''}`}>
              <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} />
              <strong>{t.title}</strong>
              <span className="muted small">{t.text}</span>
            </label>
          ))}
        </fieldset>
        <div className="field-row">
          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="INR">INR — Indian Rupee</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="nickname">
              Nickname <span className="optional">optional</span>
            </label>
            <input id="nickname" maxLength={60} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Rainy day fund" />
          </div>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I confirm the information in my profile is accurate and I agree to the account terms.
        </label>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={!agree || submitting}>
            {submitting ? <Spinner small /> : 'Submit application'}
          </button>
          {onCancel && (
            <button className="btn btn-ghost" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
