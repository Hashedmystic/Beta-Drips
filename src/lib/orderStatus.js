export function emailStatusText(status) {
  return ({
    accepted: 'Confirmation email accepted by Mailgun; inbox delivery is not verified.',
    failed: 'Confirmation email failed. Your order remains saved.',
    not_configured: 'Confirmation email is not configured. Your order remains saved.',
    pending: 'Confirmation email is pending.',
    processing: 'Confirmation email processing; delivery has not been confirmed.',
    unknown: 'Confirmation email status is uncertain. Your order remains saved.',
  })[status] || 'Confirmation email status is unavailable.';
}
