import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Eye,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { LoanApplication, LoanDocument } from '../../types';
import { formatCurrencyINR, formatDateIndian, formatDateTimeIndian } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';

export const DocumentVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, canVerifyDocuments } = useAuth();
  const { showToast } = usePwa();

  const [applications, setApplications] = useState<LoanApplication[]>(() => storage.getApplications());
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  // Filter applications that are in Document Verification or Submitted or have pending docs
  const verificationQueue = applications.filter(
    (a) =>
      a.status === 'Document Verification' ||
      a.status === 'Submitted' ||
      a.documents.some((d) => d.status === 'Pending' || d.status === 'Received')
  );

  const selectedApp = applications.find((a) => a.id === selectedAppId) || verificationQueue[0];

  const handleVerifyDocument = (docId: string, status: 'Verified' | 'Rejected') => {
    if (!selectedApp) return;

    const nextDocs = selectedApp.documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          status,
          verifiedAt: new Date().toISOString(),
          verifiedBy: currentUser.name,
          remarks: status === 'Verified' ? 'Document scrutinized & approved' : 'Document rejected: Re-upload required',
        };
      }
      return d;
    });

    const allVerified = nextDocs.every((d) => d.status === 'Verified');

    const updatedApp: LoanApplication = {
      ...selectedApp,
      documents: nextDocs,
      status: allVerified ? 'Credit Assessment' : selectedApp.status,
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          role: currentUser.role,
          action: `Document ${status}`,
          details: `${nextDocs.find((d) => d.id === docId)?.type} was marked as ${status}.${
            allVerified ? ' All documents verified! Auto-forwarded to Credit Assessment.' : ''
          }`,
        },
        ...selectedApp.auditTrail,
      ],
    };

    storage.saveApplication(updatedApp);
    showToast(
      'Document Updated',
      `${status} recorded by ${currentUser.name}.${allVerified ? ' Advanced to Credit Assessment!' : ''}`,
      status === 'Verified' ? 'success' : 'alert'
    );
  };

  const handleRequestMissingDocument = (docType: string) => {
    showToast('Document Requested', `SMS & Email notification dispatched to applicant for ${docType}.`, 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Document Verification Workbench
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Scrutinize identity, income proofs, and bank statements before credit underwriting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle className="text-sm">Verification Queue</CardTitle>
              <p className="text-xs text-slate-400">{verificationQueue.length} files awaiting verification</p>
            </div>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
            {verificationQueue.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const pendingCount = app.documents.filter((d) => d.status !== 'Verified').length;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-600 dark:text-teal-400">{app.id}</span>
                    <Badge variant={pendingCount > 0 ? 'warning' : 'success'} className="text-[10px]">
                      {pendingCount > 0 ? `${pendingCount} Pending` : 'All Verified'}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {app.applicant.fullName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{app.loanDetails.product}</span>
                    <span>{formatCurrencyINR(app.loanDetails.requestedAmount)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Active Application Documents Workbench */}
        {selectedApp ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Application Summary Card */}
            <Card className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedApp.applicant.fullName}
                    </h3>
                    <Badge variant="outline">{selectedApp.id}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Branch: {selectedApp.branch} • Applied: {formatDateIndian(selectedApp.createdAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/applications/${selectedApp.id}`)}
                  className="text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full File</span>
                </Button>
              </div>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Submitted Verification Documents</CardTitle>
                <Badge variant="primary">{selectedApp.documents.length} Required</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedApp.documents.map((doc) => (
                    <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{doc.type}</span>
                          <Badge
                            variant={
                              doc.status === 'Verified'
                                ? 'success'
                                : doc.status === 'Rejected'
                                ? 'danger'
                                : doc.status === 'Received'
                                ? 'primary'
                                : 'warning'
                            }
                            className="text-[10px]"
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {doc.fileName ? `File: ${doc.fileName} (${doc.fileSize || '1.2 MB'})` : 'Missing / Not uploaded yet'}
                        </p>
                        {doc.remarks && (
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5">
                            Scrutiny note: {doc.remarks}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.fileName ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                              className="text-xs text-emerald-600 hover:text-emerald-700 h-8"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              <span>Verify</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id, 'Rejected')}
                              className="text-xs text-rose-600 hover:text-rose-700 h-8"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Reject</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRequestMissingDocument(doc.type)}
                            className="text-xs h-8"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            <span>Request Doc</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-400">
            Select an application from the verification queue.
          </div>
        )}
      </div>
    </div>
  );
};
