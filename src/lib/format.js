export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  AUDITOR: 'Auditor',
  ACCOUNT_HOLDER: 'Account holder',
};

export const ACCOUNT_TYPE_LABELS = { CHECKING: 'Checking', SAVINGS: 'Savings', BUSINESS: 'Business' };

export const ACCOUNT_STATUS_LABELS = {
  PENDING_APPROVAL: 'Pending review',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  FROZEN: 'Frozen',
  CLOSED: 'Closed',
};

export const TXN_TYPE_LABELS = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
};

export const isDebit = (type) => type === 'WITHDRAWAL' || type === 'TRANSFER_OUT';

/** "+$1,200.00" / "−$50.00" */
export function signedMoney(txn) {
  return `${isDebit(txn.type) ? '−' : '+'}${money(txn.amount, txn.currency)}`;
}

export const ACTION_LABELS = {
  'auth.register': 'Registered',
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in',
  'auth.login_blocked': 'Blocked sign-in',
  'auth.logout': 'Signed out',
  'auth.refresh_reuse_detected': 'Session token reuse detected',
  'auth.password_reset_requested': 'Requested password reset',
  'auth.password_reset': 'Reset password',
  'account.applied': 'Applied for account',
  'account.approved': 'Approved account',
  'account.rejected': 'Rejected account',
  'account.frozen': 'Froze account',
  'account.unfrozen': 'Unfroze account',
  'transaction.deposit': 'Posted deposit',
  'transaction.withdrawal': 'Posted withdrawal',
  'transaction.transfer': 'Transferred money',
  'user.created': 'Created user',
  'user.updated': 'Updated user',
};

export function money(amount, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount || 0));
}

export function dateTime(value) {
  if (!value) return '—';
  const d = new Date(value.endsWith?.('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function maskAccount(number) {
  return number ? `•••• ${number.slice(-4)}` : '';
}

export function groupAccountNumber(number) {
  return number ? number.replace(/(\d{4})(?=\d)/g, '$1 ') : '';
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
