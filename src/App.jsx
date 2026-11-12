import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth, { GuestOnly } from './components/RequireAuth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AccountsPage from './pages/AccountsPage.jsx';
import AdminAccountsPage from './pages/AdminAccountsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';

function Message({ code, title, text }) {
  return (
    <div className="full-center">
      <div className="message-card">
        <span className="message-code">{code}</span>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <Link className="btn btn-primary" to="/">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly redirectTo="/accounts"><RegisterPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
      {/* Reachable even when signed in: the link comes from an email. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        <Route path="accounts" element={<RequireAuth roles={['ACCOUNT_HOLDER']}><AccountsPage /></RequireAuth>} />
        <Route
          path="admin/accounts"
          element={<RequireAuth roles={['ADMIN', 'AUDITOR']}><AdminAccountsPage /></RequireAuth>}
        />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="admin/users" element={<RequireAuth roles={['ADMIN']}><AdminUsersPage /></RequireAuth>} />
        <Route path="audit" element={<RequireAuth roles={['ADMIN', 'AUDITOR']}><AuditLogPage /></RequireAuth>} />
      </Route>

      <Route
        path="/forbidden"
        element={<Message code="403" title="Access restricted" text="Your role does not have access to that page." />}
      />
      <Route path="*" element={<Message code="404" title="Page not found" text="That page does not exist." />} />
    </Routes>
  );
}
