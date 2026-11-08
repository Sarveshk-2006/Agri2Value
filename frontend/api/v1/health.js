export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    app: 'Agri2Value',
    version: '0.1.0',
    environment: 'production',
    database: 'connected',
    demo_mode: true,
  });
}
