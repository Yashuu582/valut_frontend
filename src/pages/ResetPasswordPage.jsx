import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Spinner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import AuthLayout, { PasswordInput } from './AuthLayout.jsx';
import { PASSWORD_RULES, PasswordChecklist } from './RegisterPage.jsx';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pwValid = PASSWORD_RULES.every((r) => r.test(password));
  const matches = password && password === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api('/api/auth/reset-password', {
        method: 'POST',
        body: { token, new_password: password },
      });
      setDone(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <>
      <Link to="/login">Back to sign in</Link>
    </>
  );

  if (!token) {
    return (
      <AuthLayout title="Reset link missing" footer={footer}>
        <div className="form">
          <Alert>This page needs the link from your reset email.</Alert>
          <Link className="btn btn-primary btn-block" to="/forgot-password">
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="form">
          <Alert kind="success">{done}</Alert>
          <Link className="btn btn-primary btn-block" to="/login">
            Sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="You'll be signed out on all devices once it's changed."
      footer={footer}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{error}</Alert>
        {error.includes('expired') && (
          <Link to="/forgot-password" className="small">
            Request a new reset link
          </Link>
        )}
        <div className="field">
          <label htmlFor="password">New password</label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <PasswordChecklist password={password} />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm && !matches && <span className="field-error">Passwords do not match</span>}
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !pwValid || !matches}>
          {submitting ? <Spinner small /> : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}
