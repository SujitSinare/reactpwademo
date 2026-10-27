import webPush from 'web-push';

const publicKey = process.env.VAPID_PUBLIC_KEY || 'BGubeRBQtuBUbFZlAY6BdjdC0py0ac1T8r519D-x8RZXu8lrPiaQQCxA-yyIXPTOiJQ9vTRQ0Nri6hWRvFsGiVk';
const privateKey = process.env.VAPID_PRIVATE_KEY || 'HBYAMcNbaaQkcdoKCmnGt3vUMFnbwPRKTGa8zoOv_bQ';
const subject = process.env.VAPID_SUBJECT || 'mailto:operations@unitybank.demo.in';

try {
  webPush.setVapidDetails(subject, publicKey, privateKey);
} catch (e) {
  console.error('Error setting VAPID details:', e);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { subscription, notification } = req.body || {};

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Missing push subscription object' });
  }

  const payload = JSON.stringify({
    title: notification?.title || 'Unity Small Finance Bank - Alert',
    body: notification?.body || 'A loan application status has been updated.',
    icon: notification?.icon || '/icons/icon-192x192.png',
    data: notification?.data || { url: '/' },
  });

  try {
    const result = await webPush.sendNotification(subscription, payload);
    return res.status(200).json({
      success: true,
      statusCode: result.statusCode,
      headers: result.headers,
    });
  } catch (error: any) {
    console.error('WebPush sendNotification failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispatch push notification',
    });
  }
}
