// Auth endpoints handler for /api/v1/auth/* on Vercel deployment
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const cleanUrl = req.url ? req.url.split('?')[0].replace(/^\/api\/v1\/auth\/?/, '').replace(/^\//, '') : '';
  const { slug } = req.query || {};
  const querySlug = Array.isArray(slug) ? slug.join('/') : (slug || '');
  const path = cleanUrl || querySlug || 'me';

  const demoUser = {
    id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
    full_name: 'Ramesh Patil',
    phone: '9876543210',
    role: 'FARMER',
    preferred_language: 'en',
    is_active: true,
    demo_mode: true,
  };

  if (path === 'me') {
    return res.status(200).json(demoUser);
  }

  if (path === 'me/language') {
    const lang = req.body?.preferred_language || 'en';
    return res.status(200).json({ ...demoUser, preferred_language: lang });
  }

  if (path === 'demo-login' || path === 'verify-otp') {
    const body = req.body || {};
    return res.status(200).json({
      access_token: 'demo-jwt-token-' + Date.now(),
      refresh_token: 'demo-refresh-token-' + Date.now(),
      token_type: 'bearer',
      user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
      full_name: body.full_name || 'Ramesh Patil',
      role: 'FARMER',
      demo_mode: true,
    });
  }

  if (path === 'send-otp') {
    return res.status(200).json({
      success: true,
      phone: req.body?.phone || '9876543210',
      message: 'OTP sent successfully. Demo code: 123456',
      is_simulated: true,
      cooldown_seconds: 60,
    });
  }

  return res.status(200).json(demoUser);
}
