import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { NAV_ITEMS } from '../lib/nav.js';
import { initials, ROLE_LABELS } from '../lib/format.js';
import Icon, { Logo } from './Icon.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`shell ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Logo light />
        </div>
        <nav className="nav" aria-label="Main">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setOpen(false)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="role-chip">
            <Icon name="lock" size={14} />
            {ROLE_LABELS[user.role]} access
          </div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
            <Icon name="menu" />
          </button>
          <div className="topbar-spacer" />
          <div className="user-menu">
            <div className="avatar" aria-hidden="true">{initials(user.full_name)}</div>
            <div className="user-meta">
              <span className="user-name">{user.full_name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <Icon name="logout" size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
