import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Spinner } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import AuthLayout from './AuthLayout.jsx';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api('/api/auth/forgot-password', {
        method: 'POST',
        body: { identifier: identifier.trim() },
      });
      setSentMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email or username and we'll send you a link to choose a new password."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {sentMessage ? (
        <div className="form">
          <Alert kind="success">{sentMessage}</Alert>
          <p className="muted small">
            The link expires in 30 minutes and works once. Didn't get it? Check your spam folder or{' '}
            <button type="button" className="link-btn" onClick={() => setSentMessage('')}>
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <Alert>{error}</Alert>
          <div className="field">
            <label htmlFor="identifier">Email or username</label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !identifier.trim()}>
            {submitting ? <Spinner small /> : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
