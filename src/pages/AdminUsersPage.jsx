import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Alert, EmptyState, PageHeader, Pagination, Spinner, StatusBadge } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { dateTime, ROLE_LABELS } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';
import { PASSWORD_RULES, PasswordChecklist } from './RegisterPage.jsx';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const { data, error, loading, reload } = useApi('/api/admin/users', { search, role, page, page_size: 20 });

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function update(u, body, message) {
    setActionError('');
    setNotice('');
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'PATCH', body });
      setNotice(message);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage who can access BalanceVault and what they can do."
        actions={
          !showCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Icon name="plus" size={16} /> Add user
            </button>
          )
        }
      />
      {showCreate && (
        <CreateUserForm
          onCancel={() => setShowCreate(false)}
          onCreated={(u) => {
            setShowCreate(false);
            setNotice(`Created ${ROLE_LABELS[u.role].toLowerCase()} ${u.email}.`);
            reload();
          }}
        />
      )}
      <Alert kind="success">{notice}</Alert>
      <Alert>{actionError || error}</Alert>

      <section className="card">
        <div className="toolbar">
          <input className="search" type="search" placeholder="Search name or email…" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)} aria-label="Search users" />
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {loading && !data ? (
          <div className="center-pad"><Spinner /></div>
        ) : data?.items.length === 0 ? (
          <EmptyState title="No users match your filters" />
        ) : (
          data && (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last sign-in</th>
                      <th>Joined</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((u) => {
                      const self = u.id === me.id;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="cell-main">{u.full_name} {self && <span className="badge badge-gray">You</span>}</div>
                            <div className="muted small">
                              {u.username && <span className="mono">@{u.username} · </span>}
                              {u.email}
                            </div>
                          </td>
                          <td>
                            <select value={u.role} disabled={self} aria-label={`Role for ${u.email}`}
                              onChange={(e) => update(u, { role: e.target.value },
                                `${u.email} is now ${ROLE_LABELS[e.target.value].toLowerCase()}.`)}>
                              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </td>
                          <td><StatusBadge status={u.status} /></td>
                          <td className="muted">{dateTime(u.last_login_at)}</td>
                          <td className="muted">{dateTime(u.created_at)}</td>
                          <td className="actions-col">
                            {!self && (u.status === 'ACTIVE' ? (
                              <button className="btn btn-danger-ghost btn-sm"
                                onClick={() => update(u, { status: 'SUSPENDED' }, `Suspended ${u.email} and signed them out.`)}>
                                Suspend
                              </button>
                            ) : (
                              <button className="btn btn-ghost btn-sm"
                                onClick={() => update(u, { status: 'ACTIVE' }, `Reactivated ${u.email}.`)}>
                                Reactivate
                              </button>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
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

function CreateUserForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ full_name: '', email: '', username: '', role: 'AUDITOR', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pwValid = PASSWORD_RULES.every((r) => r.test(form.password));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      onCreated(
        await api('/api/admin/users', {
          method: 'POST',
          body: { ...form, username: form.username.trim() || null },
        }),
      );
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
          <h2>Add user</h2>
          <p className="muted">Staff accounts (administrators, auditors) can only be created here.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="field-row">
          <div className="field">
            <label htmlFor="nu-name">Full name</label>
            <input id="nu-name" value={form.full_name} onChange={set('full_name')} required />
          </div>
          <div className="field">
            <label htmlFor="nu-email">Email</label>
            <input id="nu-email" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label htmlFor="nu-username">
              Username <span className="optional">optional</span>
            </label>
            <input id="nu-username" autoCapitalize="none" spellCheck={false} maxLength={50}
              value={form.username} onChange={set('username')} />
          </div>
          <div className="field">
            <label htmlFor="nu-role">Role</label>
            <select id="nu-role" value={form.role} onChange={set('role')}>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="nu-pw">Temporary password</label>
          <input id="nu-pw" type="text" autoComplete="off" value={form.password} onChange={set('password')} />
          <PasswordChecklist password={form.password} />
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" disabled={submitting || !pwValid || !form.full_name || !form.email}>
            {submitting ? <Spinner small /> : 'Create user'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
