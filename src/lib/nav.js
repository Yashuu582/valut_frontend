// Single source of truth for which role sees which section of the app.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'grid', roles: ['ADMIN', 'AUDITOR', 'ACCOUNT_HOLDER'] },
  { to: '/accounts', label: 'My accounts', icon: 'wallet', roles: ['ACCOUNT_HOLDER'] },
  { to: '/transactions', label: 'Transactions', icon: 'activity', roles: ['ADMIN', 'AUDITOR', 'ACCOUNT_HOLDER'] },
  { to: '/admin/accounts', label: 'Onboarding', icon: 'inbox', roles: ['ADMIN', 'AUDITOR'] },
  { to: '/admin/users', label: 'Users', icon: 'users', roles: ['ADMIN'] },
  { to: '/audit', label: 'Audit log', icon: 'shield', roles: ['ADMIN', 'AUDITOR'] },
];
