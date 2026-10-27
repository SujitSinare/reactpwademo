import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  ExternalLink,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { SystemNotification } from '../../types';
import { formatDateTimeIndian } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usePwa } from '../pwa/PwaContext';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notificationPermission,
    requestNotificationPermission,
    isPushSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestPushNotification,
    showToast,
  } = usePwa();

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => storage.getNotifications());
  const [filterType, setFilterType] = useState<string>('All');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    return storage.subscribe(() => {
      setNotifications(storage.getNotifications());
    });
  }, []);

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'Unread') return !n.read;
    if (filterType === 'Alerts') return n.type === 'alert' || n.type === 'warning';
    return true;
  });

  const handleSendTestPush = async () => {
    setIsSending(true);
    try {
      await sendTestPushNotification(
        'Sanction Alert: ULOS-2026-0002',
        'Business Loan sanction letter generated for ₹ 40,00,000 at Western Regional Hub.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    alert: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Notifications & Push Alert Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time underwriting alerts, document requests, sanction decisions, and Web Push configuration
        </p>
      </div>

      {/* Web Push Configuration Banner */}
      <Card className="border-teal-500/30 bg-gradient-to-r from-teal-50/50 via-white to-cyan-50/50 dark:from-slate-900 dark:to-slate-900">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Web Push API with VAPID
              </h3>
              <Badge variant={isPushSubscribed ? 'success' : 'outline'}>
                {isPushSubscribed ? 'Subscribed' : 'Permission: ' + notificationPermission}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Receive browser system push alerts for status changes and sanction decisions even when the browser tab is minimized or running in the background.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isPushSubscribed ? (
              <Button
                variant="primary"
                size="sm"
                onClick={subscribeToPush}
                className="text-xs gap-1.5 shadow-md shadow-teal-600/20"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Push Alerts</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribeFromPush}
                className="text-xs text-slate-500 hover:text-rose-600"
              >
                <span>Disable Push</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              isLoading={isSending}
              onClick={handleSendTestPush}
              className="text-xs gap-1.5 bg-white dark:bg-slate-800"
            >
              <Send className="w-3.5 h-3.5 text-teal-600" />
              <span>Send Test Push</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Filter & Feed */}
      <Card>
        <CardHeader className="py-3.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Notification History</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {notifications.length} Total
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              {['All', 'Unread', 'Alerts'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    filterType === t
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-300'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                storage.markAllNotificationsAsRead();
                showToast('Updated', 'All notifications marked as read.', 'info');
              }}
              className="text-[11px] text-teal-600 dark:text-teal-400"
            >
              Mark All Read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No notifications matching your selected filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    storage.markNotificationAsRead(n.id);
                    if (n.actionUrl) navigate(n.actionUrl);
                  }}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    !n.read ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5">{icons[n.type]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</h4>
                      <span className="text-[10px] text-slate-400">{formatDateTimeIndian(n.timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                    {n.applicationId && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1">
                        Application: {n.applicationId} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
