// Catch-all serverless handler for /api/v1/* on Vercel deployment
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : (slug || '');

  // 1. Health
  if (path === 'health' || path === '') {
    return res.status(200).json({
      status: 'healthy',
      app: 'Agri2Value',
      version: '0.1.0',
      environment: 'production',
      database: 'connected',
      demo_mode: true,
    });
  }

  // 2. Notifications
  if (path === 'notifications') {
    return res.status(200).json({
      items: [
        {
          id: 'notif-1',
          category: 'RISK_ALERT',
          title: 'Payment Risk Alert: Payment Overdue',
          message: 'Remaining balance of ₹31,000 pending past agreed 3-day window for AGR-2026-0001.',
          severity: 'WARNING',
          is_read: false,
          created_at: new Date().toISOString(),
          action_route: '/app/protection',
          action_label: 'Review Ledger',
        },
        {
          id: 'notif-2',
          category: 'EXECUTION',
          title: 'Execution Update: CONFIRMED',
          message: 'Reefer Van MH-15-EG-4412 reservation locked for direct buyer dispatch.',
          severity: 'SUCCESS',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          action_route: '/app/execution',
          action_label: 'Track Order',
        },
        {
          id: 'notif-3',
          category: 'HARVEST',
          title: 'Harvest Lot: Tomato (CREATED)',
          message: 'Registered 4,000 kg Summer Tomato harvest ready for decision analysis.',
          severity: 'INFO',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          action_route: '/app/lots',
          action_label: 'View Lot',
        },
      ],
      unread_count: 2,
      total: 3,
    });
  }

  // 3. Current User (Auth)
  if (path === 'auth/me') {
    return res.status(200).json({
      id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
      full_name: 'Ramesh Patil',
      phone: '9876543210',
      role: 'FARMER',
      preferred_language: 'en',
      is_active: true,
      demo_mode: true,
    });
  }

  // 4. Demo Login / Verify OTP
  if (path === 'auth/demo-login' || path === 'auth/verify-otp') {
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

  // 5. Send OTP
  if (path === 'auth/send-otp') {
    return res.status(200).json({
      success: true,
      phone: req.body?.phone || '9876543210',
      message: 'OTP sent successfully. Demo code: 123456',
      is_simulated: true,
      cooldown_seconds: 60,
    });
  }

  // 6. Farms
  if (path === 'farms') {
    return res.status(200).json({
      farms: [
        {
          id: 'd57a5758-a0f9-4e71-8203-315981944e1f',
          owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
          farm_name: 'Patil Krishi Farm',
          state: 'Maharashtra',
          district: 'Nashik',
          village: 'Niphad',
          latitude: 20.0768,
          longitude: 74.0375,
          land_area: 3.5,
          land_area_unit: 'acre',
          boundary_geojson: JSON.stringify({
            type: 'Polygon',
            coordinates: [[
              [74.036931, 20.076265],
              [74.038069, 20.076265],
              [74.038069, 20.077335],
              [74.036931, 20.077335],
              [74.036931, 20.076265],
            ]],
          }),
          is_active: true,
          resources: [
            {
              id: '3bf623c7-4852-4433-b806-2a96e6cc7514',
              resource_type: 'storage',
              name: 'Shaded On-farm Shed (2 MT capacity)',
              quantity: 2000,
              unit: 'kg',
              availability_status: 'available',
            },
            {
              id: '68ce498c-d712-49f6-844d-c60855d73a2a',
              resource_type: 'equipment',
              name: 'Plastic Harvesting Crates (20 kg each)',
              quantity: 80,
              unit: 'crates',
              availability_status: 'available',
            },
            {
              id: '06432bd2-f7ba-4c57-9e00-6f36a6ac76c7',
              resource_type: 'labour',
              name: 'Family + 2 Seasonal Labourers',
              quantity: 3,
              unit: 'persons',
              availability_status: 'available',
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }

  // 7. Crop Lots
  if (path === 'crop-lots') {
    return res.status(200).json({
      crop_lots: [
        {
          id: 'db92a8cd-c22f-4685-9f2e-9df926b88302',
          farm_id: 'd57a5758-a0f9-4e71-8203-315981944e1f',
          owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
          crop_name: 'Tomato',
          variety: 'Abhinav (Fresh Table & Processing)',
          quantity: 4000,
          quantity_unit: 'kg',
          quantity_kg_normalized: 4000,
          harvest_date: new Date().toISOString(),
          quality_grade: 'A',
          status: 'READY_FOR_ANALYSIS',
          data_mode: 'demo',
          notes: '4,000 kg Summer Tomato harvest ready for decision analysis.',
          events: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }

  // Default fallback for any other /api/v1/* request
  return res.status(200).json({
    status: 'ok',
    path,
    message: 'Agri2Value production API',
    demo_mode: true,
  });
}
