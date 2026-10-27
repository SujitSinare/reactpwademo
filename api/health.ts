// Vercel Serverless Function: Health Check
export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    system: 'Unity Small Finance Bank - Loan Origination System (LOS)',
    environment: 'DEMO — SAMPLE DATA',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    capabilities: {
      pwa: true,
      webPush: true,
      offlineSync: true,
    },
  });
}
