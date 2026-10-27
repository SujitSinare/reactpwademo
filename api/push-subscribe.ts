// In-memory subscription registry for demo runtime
const subscriptions: any[] = [];

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription payload' });
    }

    const existingIndex = subscriptions.findIndex((s) => s.endpoint === subscription.endpoint);
    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    return res.status(200).json({
      success: true,
      message: 'Push subscription registered successfully',
      totalSubscriptions: subscriptions.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
