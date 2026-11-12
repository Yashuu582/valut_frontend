import { useState } from 'react';
import Icon, { Logo } from '../components/Icon.jsx';

const POINTS = [
  { icon: 'lock', title: 'Secure sessions', text: 'httpOnly cookies, rotating refresh tokens, rate-limited sign-in.' },
  { icon: 'users', title: 'Role-based access', text: 'Account holders, auditors and administrators each see only what they need.' },
  { icon: 'shield', title: 'Full accountability', text: 'Every sensitive action is written to an append-only audit log.' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <section className="auth-brand">
        <Logo light />
        <div className="auth-brand-body">
          <h2>Structured account management with control built in.</h2>
          <ul className="auth-points">
            {POINTS.map((p) => (
              <li key={p.title}>
                <span className="auth-point-icon">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-brand-foot">© {new Date().getFullYear()} BalanceVault</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo />
          </div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </section>
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete, ...rest }) {
  const [visible, setVisibleState] = useState(false);
  const setVisible = () => setVisibleState((v) => !v);
  return (
    <div className="input-with-action">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        {...rest}
      />
      <button
        type="button"
        className="input-action"
        onClick={setVisible}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={17} />
      </button>
    </div>
  );
}
