import React from 'react';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);

  let errorMessage = 'An unexpected application error occurred while loading this page.';
  let errorStatus = 'Application Error';

  if (isRouteErrorResponse(error)) {
    errorStatus = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 text-center space-y-5 animate-in fade-in-50 duration-200">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {errorStatus}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            Unable to Load Workspace
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {errorMessage}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Page</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/')}
            className="text-xs gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </Button>
        </div>

        {error instanceof Error && error.stack && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-between w-full"
            >
              <span>Diagnostic Details</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showDetails && (
              <pre className="mt-2 p-2 bg-slate-50 dark:bg-slate-950 text-[10px] text-rose-600 dark:text-rose-400 font-mono rounded overflow-x-auto max-h-40 leading-snug border border-slate-200 dark:border-slate-800">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
