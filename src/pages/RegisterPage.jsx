import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Spinner } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import AuthLayout, { PasswordInput } from './AuthLayout.jsx';

export const PASSWORD_RULES = [
  { test: (p) => p.length >= 12, label: 'At least 12 characters' },
  { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), label: 'Upper and lowercase letters' },
  { test: (p) => /\d/.test(p), label: 'A number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'A symbol' },
];

export function PasswordChecklist({ password }) {
  return (
    <ul className="pw-rules">
      {PASSWORD_RULES.map((r) => (
        <li key={r.label} className={r.test(password) ? 'ok' : ''}>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', username: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const pwValid = PASSWORD_RULES.every((r) => r.test(form.password));
  const matches = form.password && form.password === form.confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!pwValid) return setError('Your password does not meet the requirements.');
    if (!matches) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        username: form.username.trim() || null,
        phone: form.phone.trim() || null,
        password: form.password,
      }); // <GuestOnly redirectTo="/accounts"> takes over from here
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign up"
      subtitle="Step 1 of 2 — set up your sign-in. Next you'll apply for your first account."
      footer={
        <>
          Already have a profile? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="full_name">Full legal name</label>
          <input id="full_name" autoComplete="name" value={form.full_name} onChange={set('full_name')} required />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label htmlFor="username">
              Username <span className="optional">optional</span>
            </label>
            <input
              id="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={50}
              value={form.username}
              onChange={set('username')}
              placeholder="e.g. jane.doe"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="phone">
            Phone <span className="optional">optional</span>
          </label>
          <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          <PasswordChecklist password={form.password} />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          {form.confirm && !matches && <span className="field-error">Passwords do not match</span>}
        </div>
        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={submitting || !form.full_name || !form.email || !pwValid || !matches}
        >
          {submitting ? <Spinner small /> : 'Create profile & continue'}
        </button>
      </form>
    </AuthLayout>
  );
}
