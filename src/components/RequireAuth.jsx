import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export function FullPageSpinner() {
  return (
    <div className="full-center">
      <div className="spinner" role="status" aria-label="Loading" />
    </div>
  );
}

/** Guards a route: requires a session, and optionally one of `roles`. */
export default function RequireAuth({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return children;
}

/** Login/register pages. Once a session exists, sends the user on (back to where they were headed). */
export function GuestOnly({ redirectTo = '/', children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={location.state?.from || redirectTo} replace />;
  return children;
}
