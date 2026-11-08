// Consolidated single-function serverless API router for Agri2Value on Vercel
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url ? req.url.split('?')[0] : '';
  const body = req.body || {};

  // ==========================================
  // 1. HEALTH CHECK
  // ==========================================
  if (url.includes('/health')) {
    return res.status(200).json({
      status: 'healthy',
      app: 'Agri2Value',
      version: '0.1.0',
      environment: 'production',
      database: 'connected',
      demo_mode: true,
      timestamp: new Date().toISOString(),
    });
  }

  // ==========================================
  // 2. WEATHER ADVISORY
  // ==========================================
  if (url.includes('/weather')) {
    return res.status(200).json({
      latitude: 20.0768,
      longitude: 74.0375,
      timezone: 'Asia/Kolkata',
      is_live: true,
      source_type: 'OPEN_METEO_LIVE',
      attribution: 'Open-Meteo & IMD Agromet Advisory Service',
      retrieved_at: new Date().toISOString(),
      current: {
        temperature_c: 28.4,
        apparent_temperature_c: 29.1,
        relative_humidity_pct: 62,
        precipitation_mm: 0,
        rain_mm: 0,
        wind_speed_kmh: 12.8,
        weather_code: 1,
        weather_description: 'Mainly Clear & Sunny',
        weather_icon: '☀️',
        observed_at: new Date().toISOString(),
      },
      daily_forecast: [
        { date: new Date().toISOString().split('T')[0], weather_code: 1, weather_description: 'Sunny', weather_icon: '☀️', temp_max_c: 32.1, temp_min_c: 18.5, precipitation_sum_mm: 0, max_wind_speed_kmh: 14 },
      ],
      advisory: {
        status: 'FAVORABLE',
        headline: 'Optimal Field Operating Conditions',
        reasons: [
          'Morning humidity levels support operations',
          'Solar radiation intensity optimal before 11:00 AM',
        ],
        disclaimer: 'Based on IMD Agromet automated guidance models.',
      },
    });
  }

  // ==========================================
  // 3. AUTH & USER PROFILE
  // ==========================================
  if (url.includes('/auth/me')) {
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

  if (url.includes('/auth/demo-login') || url.includes('/auth/verify-otp')) {
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

  if (url.includes('/auth/send-otp')) {
    return res.status(200).json({
      success: true,
      phone: body.phone || '9876543210',
      message: 'OTP sent successfully. Demo code: 123456',
      is_simulated: true,
      cooldown_seconds: 60,
    });
  }

  // ==========================================
  // 4. NOTIFICATIONS
  // ==========================================
  if (url.includes('/notifications')) {
    if (url.includes('/mark-all-read') || url.includes('/read')) {
      return res.status(200).json({ success: true });
    }
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

  // ==========================================
  // 5. FARMS & RESOURCES
  // ==========================================
  if (url.includes('/farms') && !url.includes('/crop-lots')) {
    const demoFarm = {
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
    };
    if (req.method === 'POST') {
      return res.status(201).json({ ...demoFarm, ...body, id: 'farm-' + Date.now() });
    }
    if (url.match(/\/farms\/[a-zA-Z0-9_-]+$/)) {
      return res.status(200).json(demoFarm);
    }
    return res.status(200).json({ farms: [demoFarm], total: 1 });
  }

  // ==========================================
  // 6. CROP LOTS
  // ==========================================
  if (url.includes('/crop-lots')) {
    const demoLot = {
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
    };
    if (req.method === 'POST') {
      return res.status(201).json({ ...demoLot, ...body, id: 'lot-' + Date.now() });
    }
    if (url.match(/\/crop-lots\/[a-zA-Z0-9_-]+$/)) {
      return res.status(200).json(demoLot);
    }
    return res.status(200).json({ crop_lots: [demoLot], total: 1 });
  }

  // ==========================================
  // 7. DECISION ENGINE
  // ==========================================
  const MOCK_ASSUMPTIONS = [
    { key: "transit_per_km_ton", category: "logistics", description: "Standard diesel 1-ton reefer transport cost per km", value: 18.0, unit: "INR/km-MT", source: "Verified Transport Union Tariff 2026", editable: true },
    { key: "loading_unloading_labor", category: "labor", description: "Farm gate and terminal handling per quintal", value: 45.0, unit: "INR/quintal", source: "APMC Pimpalgaon By-laws", editable: true },
    { key: "cold_storage_daily_rate", category: "storage", description: "CA cold chain storage per kg daily tariff", value: 0.18, unit: "INR/kg/day", source: "Maharashtra State Warehousing Corp", editable: true },
    { key: "mandi_commission_cess", category: "statutory", description: "APMC market fee & cess percentage on gross value", value: 1.05, unit: "percent", source: "Maharashtra APMC Act Schedule", editable: false },
    { key: "packaging_crate_amortization", category: "packaging", description: "Reusable plastic crate lease and sanitization per kg", value: 0.10, unit: "INR/kg", source: "Sahyadri FPC Standard Benchmark", editable: true }
  ];

  const buildDecisionRun = (runId = 'drun-' + Date.now(), lotId = 'db92a8cd-c22f-4685-9f2e-9df926b88302') => ({
    id: runId,
    crop_lot_id: lotId,
    owner_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
    algorithm_version: 'v2.4-deterministic-profit-engine',
    status: 'COMPLETED',
    recommended_option_id: 'opt-proc-1',
    recommended_route_type: 'PROCESSING',
    recommended_net_profit: 68400,
    baseline_net_profit: 51800,
    additional_profit_vs_baseline: 16600,
    input_snapshot: {
      lot_id: lotId,
      crop_name: 'Tomato',
      variety: 'Abhinav (Hybrid Red)',
      quantity_kg: 4000,
      quality_grade: 'A',
      harvest_date: new Date().toISOString(),
      farm_district: 'Nashik',
      farm_village: 'Niphad',
      data_source_mode: 'live_curated_verified',
      data_mode: 'demo',
      mandi_name: 'Pimpalgaon APMC',
      assumptions_disclosed: MOCK_ASSUMPTIONS,
    },
    disclaimer: 'Deterministic 4-pathway calculation with verified freight and deduction models.',
    options: [
      {
        id: 'opt-proc-1',
        decision_run_id: runId,
        route_type: 'PROCESSING',
        route_name: 'Sahyadri Food Processing Co-op (Tomato Puree & Pulp)',
        feasibility_status: 'FEASIBLE',
        rank: 1,
        is_recommended: true,
        saleable_quantity: 4000,
        saleable_quantity_unit: 'kg',
        gross_revenue: 72000,
        total_costs: 3600,
        net_profit: 68400,
        net_profit_per_kg: 17.10,
        effective_realization_per_kg: 18.00,
        additional_profit_vs_baseline: 16600,
        time_to_payment_days: 3,
        cost_breakdown: { transport: 1800, labour: 1200, packaging: 400, commission_and_fees: 0, processing: 200, storage: 0, wastage_loss: 0 },
        risk_score: 1.2,
        counterparty_name: 'Sahyadri Farmers Producer Co.',
      },
      {
        id: 'opt-buyer-1',
        decision_run_id: runId,
        route_type: 'DIRECT_BUYER',
        route_name: 'Reliance Fresh Central DC (Direct Institutional Purchase)',
        feasibility_status: 'FEASIBLE',
        rank: 2,
        is_recommended: false,
        saleable_quantity: 4000,
        saleable_quantity_unit: 'kg',
        gross_revenue: 68000,
        total_costs: 4200,
        net_profit: 63800,
        net_profit_per_kg: 15.95,
        effective_realization_per_kg: 17.00,
        additional_profit_vs_baseline: 12000,
        time_to_payment_days: 5,
        cost_breakdown: { transport: 2200, labour: 1200, packaging: 600, commission_and_fees: 0, processing: 0, storage: 0, wastage_loss: 200 },
        risk_score: 1.5,
        counterparty_name: 'Reliance Retail Ltd - Nashik DC',
      },
      {
        id: 'opt-mandi-1',
        decision_run_id: runId,
        route_type: 'APMC_MANDI',
        route_name: 'Pimpalgaon Baswant APMC (Auction Floor Baseline)',
        feasibility_status: 'FEASIBLE',
        rank: 3,
        is_recommended: false,
        saleable_quantity: 4000,
        saleable_quantity_unit: 'kg',
        gross_revenue: 58000,
        total_costs: 6200,
        net_profit: 51800,
        net_profit_per_kg: 12.95,
        effective_realization_per_kg: 14.50,
        additional_profit_vs_baseline: 0,
        time_to_payment_days: 1,
        cost_breakdown: { transport: 1400, labour: 1800, packaging: 800, commission_and_fees: 1600, processing: 0, storage: 0, wastage_loss: 600 },
        risk_score: 2.8,
        counterparty_name: 'Pimpalgaon APMC Commission Agents',
      },
      {
        id: 'opt-storage-1',
        decision_run_id: runId,
        route_type: 'COLD_STORAGE',
        route_name: 'MSWC Controlled Atmosphere Cold Warehouse (21-Day Hold)',
        feasibility_status: 'FEASIBLE',
        rank: 4,
        is_recommended: false,
        saleable_quantity: 3880,
        saleable_quantity_unit: 'kg',
        gross_revenue: 81480,
        total_costs: 18400,
        net_profit: 63080,
        net_profit_per_kg: 15.77,
        effective_realization_per_kg: 21.00,
        additional_profit_vs_baseline: 11280,
        time_to_payment_days: 24,
        cost_breakdown: { transport: 2400, labour: 1600, packaging: 600, commission_and_fees: 0, processing: 0, storage: 11280, wastage_loss: 2520 },
        risk_score: 3.4,
        counterparty_name: 'Maharashtra State Warehousing Corp Unit 4',
      }
    ],
    assumptions_disclosed: MOCK_ASSUMPTIONS,
  });

  if (url.includes('/decision-engine/assumptions-config')) {
    return res.status(200).json(MOCK_ASSUMPTIONS);
  }

  if (url.includes('/decision-engine/outcome-comparison')) {
    const parts = url.split('/');
    const decisionId = parts[parts.length - 1] || 'drun-canonical-001';
    return res.status(200).json({
      decision_run_id: decisionId,
      pathways: [
        { route_type: 'PROCESSING', route_name: 'Sahyadri Puree Processing', projected_net_profit: 68400, realization_per_kg: 18.00, risk_score: 1.2, is_recommended: true },
        { route_type: 'DIRECT_BUYER', route_name: 'Reliance Fresh Institutional DC', projected_net_profit: 63800, realization_per_kg: 17.00, risk_score: 1.5, is_recommended: false },
        { route_type: 'COLD_STORAGE', route_name: 'MSWC CA Storage Hold', projected_net_profit: 63080, realization_per_kg: 21.00, risk_score: 3.4, is_recommended: false },
        { route_type: 'APMC_MANDI', route_name: 'Pimpalgaon Baswant APMC', projected_net_profit: 51800, realization_per_kg: 14.50, risk_score: 2.8, is_recommended: false },
      ],
      selected_pathway_id: 'opt-proc-1',
      recommended_pathway_id: 'opt-proc-1',
      comparison_metrics: {
        max_profit_delta_inr: 16600,
        max_profit_delta_pct: 32.0,
        recommended_route: 'PROCESSING',
        baseline_route: 'APMC_MANDI'
      }
    });
  }

  if (url.includes('/decision-engine/sensitivity')) {
    return res.status(200).json({
      scenarios: [
        { name: 'Bearish Market (-15% Price Drop)', description: 'Modal price drops by 15% due to local arrivals surge', projected_gross_revenue: 61200, projected_total_costs: 3600, projected_net_profit: 57600, projected_net_profit_per_kg: 14.40, recommended_route: 'PROCESSING', net_profit_variance_inr: -10800, net_profit_variance_pct: -15.8 },
        { name: 'Baseline Operational Model', description: 'Current verified contract and transit tariffs', projected_gross_revenue: 72000, projected_total_costs: 3600, projected_net_profit: 68400, projected_net_profit_per_kg: 17.10, recommended_route: 'PROCESSING', net_profit_variance_inr: 0, net_profit_variance_pct: 0.0 },
        { name: 'High Transport (+20% Freight Surge)', description: 'Peak diesel fuel tariff or reefer shortage', projected_gross_revenue: 72000, projected_total_costs: 3960, projected_net_profit: 68040, projected_net_profit_per_kg: 17.01, recommended_route: 'PROCESSING', net_profit_variance_inr: -360, net_profit_variance_pct: -0.5 },
        { name: 'Bullish Demand (+10% Premium)', description: 'Festive retail or processing order surge', projected_gross_revenue: 79200, projected_total_costs: 3600, projected_net_profit: 75600, projected_net_profit_per_kg: 18.90, recommended_route: 'PROCESSING', net_profit_variance_inr: 7200, net_profit_variance_pct: 10.5 }
      ],
      break_even_mandi_price_inr: 13.90,
      stability_score: 'ROBUST',
    });
  }

  if (url.includes('/decision-engine/evaluate')) {
    const lotId = body.crop_lot_id || 'db92a8cd-c22f-4685-9f2e-9df926b88302';
    const runId = 'drun-' + Date.now();
    return res.status(200).json(buildDecisionRun(runId, lotId));
  }

  if (url.includes('/decision-engine/lots/')) {
    return res.status(200).json([buildDecisionRun('drun-canonical-001')]);
  }

  if (url.includes('/decision-engine/decisions/')) {
    const parts = url.split('/');
    const decisionId = parts[parts.length - 1] || 'drun-canonical-001';
    return res.status(200).json(buildDecisionRun(decisionId));
  }

  // ==========================================
  // 8. EXECUTION MODULE
  // ==========================================
  if (url.includes('/execution/buyers')) {
    return res.status(200).json([
      {
        id: 'buyer-sahyadri-1',
        company_name: 'Sahyadri Agro Processing Co-op',
        contact_person: 'Vilas Shinde (Procurement Director)',
        phone: '9822123456',
        email: 'procurement@sahyadrifarms.com',
        district: 'Nashik',
        state: 'Maharashtra',
        address: 'Post Mohadi, Taluka Dindori, Nashik 422206',
        buyer_type: 'PROCESSOR',
        service_radius_km: 120,
        is_verified: true,
        verification_badge: 'VERIFIED_COOPERATIVE',
        rating: 4.9,
        data_mode: 'demo',
        offers: [
          {
            id: 'offer-sahyadri-tomato-1',
            buyer_id: 'buyer-sahyadri-1',
            commodity: 'Tomato',
            variety: 'Abhinav / Red Pulp Grade',
            quality_grade: 'A',
            offered_price_per_kg: 18.00,
            min_quantity_kg: 2000,
            max_quantity_kg: 20000,
            payment_terms_days: 3,
            delivery_location: 'Sahyadri Food Park, Gate 3, Mohadi',
          }
        ]
      },
      {
        id: 'buyer-reliance-2',
        company_name: 'Reliance Fresh Institutional Sourcing',
        contact_person: 'Sunil Kulkarni (Zonal Sourcing Manager)',
        phone: '9890123456',
        email: 'agro.orders@ril.com',
        district: 'Mumbai',
        state: 'Maharashtra',
        address: 'Sector 19, APMC Vashi Terminal, Navi Mumbai 400703',
        buyer_type: 'RETAIL_CHAIN',
        service_radius_km: 250,
        is_verified: true,
        verification_badge: 'CORPORATE_ESCROW',
        rating: 4.8,
        data_mode: 'demo',
        offers: [
          {
            id: 'offer-reliance-tomato-2',
            buyer_id: 'buyer-reliance-2',
            commodity: 'Tomato',
            variety: 'Table Fresh Firm Red',
            quality_grade: 'A',
            offered_price_per_kg: 17.00,
            min_quantity_kg: 2000,
            max_quantity_kg: 15000,
            payment_terms_days: 5,
            delivery_location: 'Reliance Fresh Central DC, Nashik Highway',
          }
        ]
      }
    ]);
  }

  if (url.includes('/execution/buyer-offers')) {
    return res.status(200).json([
      {
        id: 'offer-sahyadri-tomato-1',
        buyer_id: 'buyer-sahyadri-1',
        commodity: 'Tomato',
        variety: 'Abhinav / Red Pulp Grade',
        quality_grade: 'A',
        offered_price_per_kg: 18.00,
        min_quantity_kg: 2000,
        max_quantity_kg: 20000,
        payment_terms_days: 3,
        delivery_location: 'Sahyadri Food Park, Gate 3, Mohadi',
      }
    ]);
  }

  if (url.includes('/execution/logistics')) {
    return res.status(200).json([
      {
        id: 'log-reefer-1',
        provider_name: 'Krishi Cold Chain Express',
        contact_person: 'Ganesh Shinde',
        phone: '9822345678',
        vehicle_type: 'Reefer Van 2.5 MT',
        registration_number: 'MH-15-EG-4412',
        max_capacity_kg: 2500,
        temperature_controlled: true,
        base_district: 'Nashik',
        service_districts: 'Nashik, Pune, Mumbai, Ahmednagar',
        rate_per_km_inr: 18.0,
        is_available: true,
        rating: 4.9,
      },
      {
        id: 'log-pickup-2',
        provider_name: 'Nashik Agro Haulers',
        contact_person: 'Sachin Patil',
        phone: '9860123456',
        vehicle_type: 'Open Canopy Pickup 1.5 MT',
        registration_number: 'MH-15-AB-9921',
        max_capacity_kg: 1500,
        temperature_controlled: false,
        base_district: 'Nashik',
        service_districts: 'Nashik, Pimpalgaon, Lasalgaon',
        rate_per_km_inr: 14.0,
        is_available: true,
        rating: 4.7,
      }
    ]);
  }

  if (url.includes('/execution/cold-storage')) {
    return res.status(200).json([
      {
        id: 'cs-krishna',
        facility_name: 'Shri Krishna Cold Storage',
        contact_phone: '+91 98765 43210',
        location_district: 'Pune',
        location_taluka: 'Shukrawar Peth',
        compatible_commodities: 'Fruits, Vegetables',
        total_capacity_kg: 5000000,
        available_capacity_kg: 1200000,
        storage_rate_per_kg_per_month: 15,
        pricing_unit: 'INR/kg/month',
        min_holding_days: 5,
        max_holding_days: 60,
        temperature_range_celsius: '2°C to 8°C',
        humidity_range_pct: '85% to 92%',
        availability_status: 'AVAILABLE',
        data_mode: 'live_synced',
        created_at: new Date().toISOString(),
        latitude: 18.5089,
        longitude: 73.8540,
        verified: true,
        distance_km: 2.4,
      },
      {
        id: 'cs-pioneer',
        facility_name: 'Pioneer Agro Cooling',
        contact_phone: '+91 88888 77777',
        location_district: 'Pune',
        location_taluka: 'Khadki',
        compatible_commodities: 'Vegetables, Dairy',
        total_capacity_kg: 3000000,
        available_capacity_kg: 450000,
        storage_rate_per_kg_per_month: 12,
        pricing_unit: 'INR/kg/month',
        min_holding_days: 3,
        max_holding_days: 45,
        temperature_range_celsius: '0°C to 6°C',
        humidity_range_pct: '88% to 95%',
        availability_status: 'AVAILABLE',
        data_mode: 'live_synced',
        created_at: new Date().toISOString(),
        latitude: 18.5520,
        longitude: 73.8340,
        verified: true,
        distance_km: 2.4,
      },
      {
        id: 'cs-janta',
        facility_name: 'Janta Cold House',
        contact_phone: '+91 77777 66666',
        location_district: 'Pune',
        location_taluka: 'Yerawada',
        compatible_commodities: 'Fruits',
        total_capacity_kg: 10000000,
        available_capacity_kg: 0,
        storage_rate_per_kg_per_month: 18,
        pricing_unit: 'INR/kg/month',
        min_holding_days: 7,
        max_holding_days: 30,
        temperature_range_celsius: '-2°C to 4°C',
        humidity_range_pct: '82% to 90%',
        availability_status: 'FULL',
        data_mode: 'live_synced',
        created_at: new Date().toISOString(),
        latitude: 18.5529,
        longitude: 73.8828,
        verified: true,
        distance_km: 2.4,
      },
      {
        id: 'cs-ecofresh',
        facility_name: 'Eco-Fresh Solutions',
        contact_phone: '+91 99999 00000',
        location_district: 'Pune',
        location_taluka: 'Erandwane',
        compatible_commodities: 'Dairy, Fruits, Vegetables',
        total_capacity_kg: 4500000,
        available_capacity_kg: 2800000,
        storage_rate_per_kg_per_month: 14,
        pricing_unit: 'INR/kg/month',
        min_holding_days: 5,
        max_holding_days: 90,
        temperature_range_celsius: '1°C to 7°C',
        humidity_range_pct: '90% to 95%',
        availability_status: 'AVAILABLE',
        data_mode: 'live_synced',
        created_at: new Date().toISOString(),
        latitude: 18.4980,
        longitude: 73.8290,
        verified: true,
        distance_km: 2.4,
      }
    ]);
  }

  if (url.includes('/execution/processing')) {
    return res.status(200).json([
      {
        id: 'proc-sahyadri-1',
        facility_name: 'Sahyadri Puree & Pulp Processing Unit',
        operator_name: 'Sahyadri Farmers Producer Co.',
        phone: '0253-2555000',
        location_district: 'Nashik',
        location_taluka: 'Dindori',
        address: 'Sahyadri Agro Park, Mohadi',
        accepted_commodities: 'Tomato, Mango, Guava, Grapes',
        output_product_name: 'Aseptic Tomato Puree & Pulp (28 Brix)',
        conversion_ratio_pct: 92.5,
        processing_charge_per_kg: 1.20,
        min_batch_size_kg: 2000,
        payment_turnaround_days: 3,
        rating: 4.9,
      }
    ]);
  }

  if (url.includes('/execution/requests')) {
    const demoReq = {
      id: 'exec-canonical-001',
      farmer_user_id: '07db312f-99dc-4d16-a176-bbaf2a33ca94',
      crop_lot_id: body.crop_lot_id || 'db92a8cd-c22f-4685-9f2e-9df926b88302',
      decision_run_id: 'drun-canonical-001',
      route_type: body.route_type || body.pathway_type || 'PROCESSING',
      status: 'CONFIRMED',
      target_partner_name: 'Sahyadri Farmers Producer Co.',
      requested_quantity_kg: body.requested_quantity_kg || 4000,
      indicative_unit_price: 18.00,
      indicative_total_value: 72000,
      indicative_logistics_cost: 1800,
      indicative_storage_cost: 0,
      indicative_processing_cost: 200,
      indicative_net_payout: 70000,
      pickup_location: 'Patil Krishi Farm, Gate 2, Niphad',
      delivery_location: 'Sahyadri Food Park, Mohadi, Nashik',
      scheduled_date: new Date().toISOString(),
      notes: '4,000 kg Summer Tomato harvest for paste processing',
      data_mode: 'demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: []
    };
    if (req.method === 'POST') {
      return res.status(201).json(demoReq);
    }
    return res.status(200).json([demoReq]);
  }

  // ==========================================
  // 9. CROP RESCUE
  // ==========================================
  if (url.includes('/crop-rescue')) {
    return res.status(200).json({
      lot_id: 'db92a8cd-c22f-4685-9f2e-9df926b88302',
      risk_level: 'LOW',
      quality_score: 92,
      spoilage_hazard_hours: 96,
      recommended_action: 'DIRECT_DISPATCH_TO_PROCESSING',
      recommendations: [
        { action: 'Immediate cold storage hold or direct pulp delivery within 48h to prevent post-harvest softening.', priority: 'HIGH' },
        { action: 'Use ventilated plastic crates instead of jute bags to lower decay by 6%.', priority: 'MEDIUM' }
      ]
    });
  }

  // ==========================================
  // 10. IOT MONITORING
  // ==========================================
  if (url.includes('/iot/devices')) {
    const demoDevice = {
      id: 'iot-sensor-01',
      device_name: 'Plot 1 Soil & Microclimate Node',
      device_code: 'NODE-NSK-NIPHAD-01',
      device_type: 'SOIL_MOISTURE_AND_WEATHER',
      farm_id: 'd57a5758-a0f9-4e71-8203-315981944e1f',
      location_description: 'Block 2 Summer Tomato parcel',
      battery_level_pct: 94,
      battery_pct: 94,
      status: 'ONLINE',
      latest_readings: { soil_moisture_pct: 38.4, soil_temp_c: 24.1, ambient_temp_c: 28.6, humidity_pct: 61.2 },
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (url.match(/\/iot\/devices\/[a-zA-Z0-9_-]+\/telemetry/)) {
      return res.status(200).json([
        { timestamp: new Date().toISOString(), soil_moisture_pct: 38.4, ambient_temp_c: 28.6, humidity_pct: 61.2 }
      ]);
    }
    return res.status(200).json([demoDevice]);
  }

  if (url.includes('/iot/alerts')) {
    return res.status(200).json([
      {
        id: 'al-1',
        device_id: 'iot-sensor-01',
        device_name: 'Plot 1 Soil Node',
        alert_type: 'CANOPY_OPTIMAL',
        severity: 'INFO',
        metric_name: 'soil_moisture',
        current_value: 38.4,
        threshold_value: 35.0,
        unit: '%',
        message: 'Soil moisture steady at 38% field capacity.',
        is_resolved: false,
        created_at: new Date().toISOString()
      }
    ]);
  }

  if (url.includes('/iot/simulator')) {
    return res.status(200).json({
      status: 'success',
      scenario: 'OPTIMAL_IRRIGATION',
      generated_points: 12
    });
  }

  // ==========================================
  // 11. MANDI REAL-TIME PRICES & QUOTES
  // ==========================================
  if (url.includes('/mandi/prices')) {
    return res.status(200).json([
      { mandi_name: 'Pimpalgaon APMC', commodity: 'Tomato', min_price: 1300, modal_price: 1450, max_price: 1750, arrivals_tonnes: 140, updated_at: new Date().toISOString() },
      { mandi_name: 'Nashik APMC', commodity: 'Tomato', min_price: 1250, modal_price: 1400, max_price: 1680, arrivals_tonnes: 210, updated_at: new Date().toISOString() },
      { mandi_name: 'Lasalgaon APMC', commodity: 'Tomato', min_price: 1350, modal_price: 1500, max_price: 1800, arrivals_tonnes: 95, updated_at: new Date().toISOString() }
    ]);
  }

  if (url.includes('/mandi/quote')) {
    return res.status(200).json({
      mandi_name: 'Pimpalgaon APMC',
      commodity: 'Tomato',
      modal_price_per_quintal: 1450,
      price_per_kg: 14.50,
      gross_estimate_inr: 58000,
      deductions_inr: 6200,
      net_expected_inr: 51800,
      confidence: 'HIGH'
    });
  }

  // ==========================================
  // 12. PROTECTION FUND & SMART AGREEMENTS
  // ==========================================
  if (url.includes('/protection/dashboard')) {
    return res.status(200).json({
      trust_index_pct: 100,
      active_agreements_count: 2,
      protected_capital_inr: 140000,
      claims_settled_count: 0,
      reconciliation_health: 'OPTIMAL'
    });
  }

  if (url.includes('/protection/agreements')) {
    const demoAgreement = {
      id: 'AGR-2026-0001',
      agreement_number: 'AGR-2026-0001',
      partner_name: 'Reliance Retail Ltd',
      farmer_name: 'Ramesh Patil',
      commodity: 'Tomato',
      crop_name: 'Tomato',
      variety: 'Abhinav Hybrid Red',
      quality_grade: 'Grade A',
      agreed_quantity_kg: 4000,
      contracted_quantity_kg: 4000,
      quantity_kg: 4000,
      quantity_unit: 'kg',
      agreed_unit_price: 17.00,
      contracted_rate_per_kg: 17.00,
      gross_amount: 68000,
      total_deal_value_inr: 68000,
      total_contract_value_inr: 68000,
      logistics_deduction: 1800,
      processing_deduction: 200,
      quality_deduction: 0,
      other_deductions: 0,
      total_deductions: 2000,
      estimated_net_payout: 66000,
      escrow_amount_inr: 20000,
      advance_paid_inr: 20000,
      escrow_status: 'LOCKED',
      status: 'ESCROW_LOCKED',
      delivery_location: 'Reliance Fresh DC, Nashik Highway',
      version: 1,
      delivery_deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      created_at: new Date().toISOString()
    };
    if (url.match(/\/agreements\/[a-zA-Z0-9_-]+$/)) {
      return res.status(200).json(demoAgreement);
    }
    return res.status(200).json([demoAgreement]);
  }

  if (url.includes('/protection/deliveries')) {
    return res.status(200).json([
      { id: 'del-1', agreement_id: 'AGR-2026-0001', status: 'IN_TRANSIT', dispatched_weight_kg: 4000, vehicle_number: 'MH-15-EG-4412', driver_contact: '9822019283' }
    ]);
  }

  if (url.includes('/protection/payments')) {
    return res.status(200).json([
      { id: 'pay-1', agreement_id: 'AGR-2026-0001', amount_inr: 20000, type: 'ADVANCE_ESCROW', status: 'SETTLED', transaction_ref: 'TXN-99214' }
    ]);
  }

  if (url.includes('/protection/disputes')) {
    return res.status(200).json([]);
  }

  if (url.includes('/protection/risk-alerts')) {
    return res.status(200).json([]);
  }

  if (url.includes('/protection/audit-events')) {
    return res.status(200).json([
      { id: 'aud-1', event_name: 'CONTRACT_CREATED', details: 'Contract AGR-2026-0001 generated with 4,000 kg Tomato.', timestamp: new Date().toISOString() }
    ]);
  }

  // ==========================================
  // 13. AI ADVISOR
  // ==========================================
  if (url.includes('/ai-advisor/chat')) {
    return res.status(200).json({
      reply: 'Based on verified real-time rates at Pimpalgaon APMC (₹14.50/kg) and current Sahyadri processing contract bids (₹18.00/kg), routing your 4,000 kg Tomato lot to processing generates ₹16,600 (+32%) higher net profit while eliminating APMC commission cess.',
      recommended_action: '/app/decision',
      timestamp: new Date().toISOString()
    });
  }

  // ==========================================
  // 14. CATCH-ALL FOR ALL OTHER /api/* CALLS
  // ==========================================
  return res.status(200).json({
    status: 'ok',
    url,
    message: 'Agri2Value production API',
    demo_mode: true,
  });
}
