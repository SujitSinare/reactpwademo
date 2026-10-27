import React from 'react';
import { usePwa } from '../../features/pwa/PwaContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Toast: React.FC = () => {
  const { toastMessage, clearToast } = usePwa();

  if (!toastMessage) return null;

  const icons = {
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    alert: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  const borderStyles = {
    info: 'border-blue-200 dark:border-blue-800',
    success: 'border-emerald-200 dark:border-emerald-800',
    warning: 'border-amber-200 dark:border-amber-800',
    alert: 'border-rose-200 dark:border-rose-800',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200 px-4">
      <div
        className={cn(
          'flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl border',
          borderStyles[toastMessage.type]
        )}
      >
        {icons[toastMessage.type]}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{toastMessage.title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{toastMessage.message}</p>
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
