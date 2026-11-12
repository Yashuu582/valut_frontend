import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Spinner } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import AuthLayout, { PasswordInput } from './AuthLayout.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier.trim(), password); // <GuestOnly> redirects once the session exists
    } catch (err) {
      setError(err.message);
      setPassword('');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your credentials to access your vault."
      footer={
        <>
          New to BalanceVault? <Link to="/register">Sign up</Link>
        </>
      }
    >
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
            placeholder="you@example.com or username"
            required
            autoFocus
          />
        </div>
        <div className="field">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="small">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !identifier || !password}>
          {submitting ? <Spinner small /> : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
