export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cleanUrl = req.url ? req.url.split('?')[0].replace(/^\/api\/v1\/protection\/?/, '').replace(/^\//, '') : '';
  const { slug } = req.query || {};
  const querySlug = Array.isArray(slug) ? slug.join('/') : (slug || '');
  const path = cleanUrl || querySlug || 'dashboard';

  const dashboardMetrics = {
    active_agreements_count: 1,
    deals_awaiting_acceptance_count: 0,
    deliveries_awaiting_confirmation_count: 0,
    expected_payments_total: 68400,
    payments_received_total: 45000,
    outstanding_balance_total: 23400,
    overdue_payments_total: 0,
    open_disputes_count: 1,
    active_risk_alerts_count: 2,
    recent_events: [
      {
        id: 'evt-1',
        agreement_id: 'agr-1',
        event_type: 'PAYMENT_RECEIVED',
        summary: 'Direct buyer advance payment received into platform escrow',
        severity: 'INFO',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      }
    ],
    disclaimer: 'Agri2Value Financial Trust provides structured commercial transparency and audit logging for farmer security.',
  };

  if (path === 'dashboard') {
    return res.status(200).json(dashboardMetrics);
  }

  if (path.includes('agreements')) {
    return res.status(200).json({ agreements: [], total: 0 });
  }

  if (path.includes('deliveries')) {
    return res.status(200).json({ deliveries: [], total: 0 });
  }

  if (path.includes('payments')) {
    return res.status(200).json({ payments: [], total: 0 });
  }

  if (path.includes('disputes')) {
    return res.status(200).json({ disputes: [], total: 0 });
  }

  if (path.includes('risk-alerts')) {
    return res.status(200).json({ alerts: [], total: 0 });
  }

  return res.status(200).json(dashboardMetrics);
}
