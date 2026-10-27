import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  ShieldCheck,
  Building2,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { ApprovalDecision, LoanApplication } from '../../types';
import { formatCurrencyINR, formatDateIndian, formatDateTimeIndian } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';

export const ApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, canApproveApplication } = useAuth();
  const { showToast } = usePwa();

  const [applications, setApplications] = useState<LoanApplication[]>(() => storage.getApplications());
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('Sanctioned as recommended under Retail Credit Policy.');

  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  const pendingApprovals = applications.filter((a) => a.status === 'Pending Approval');
  const selectedApp = applications.find((a) => a.id === selectedAppId) || pendingApprovals[0];

  const handleApprove = () => {
    if (!selectedApp) return;

    const sanctionAmount = selectedApp.assessment?.recommendedAmount || selectedApp.loanDetails.requestedAmount;
    const sanctionTenure = selectedApp.assessment?.recommendedTenureMonths || selectedApp.loanDetails.tenureMonths;
    const sanctionRate = selectedApp.assessment?.recommendedInterestRate || selectedApp.loanDetails.interestRate;

    const decision: ApprovalDecision = {
      id: `APR-${Date.now().toString().slice(-6)}`,
      decisionBy: currentUser.name,
      decisionRole: currentUser.role,
      decisionDate: new Date().toISOString(),
      status: 'Approved',
      approvedAmount: sanctionAmount,
      approvedTenureMonths: sanctionTenure,
      approvedInterestRate: sanctionRate,
      comments: approvalNotes,
    };

    const updatedApp: LoanApplication = {
      ...selectedApp,
      approval: decision,
      status: 'Ready for Disbursement',
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          role: currentUser.role,
          action: 'Sanction Approved',
          details: `Application approved for ${formatCurrencyINR(sanctionAmount)} at ${sanctionRate}% for ${sanctionTenure}m. Moved to Ready for Disbursement.`,
          previousStatus: 'Pending Approval',
          newStatus: 'Ready for Disbursement',
        },
        ...selectedApp.auditTrail,
      ],
    };

    storage.saveApplication(updatedApp);
    setShowApproveModal(false);
    showToast('Sanction Approved', `Application ${selectedApp.id} approved for disbursement.`, 'success');
  };

  const handleReject = () => {
    if (!selectedApp || !rejectionReason.trim()) {
      showToast('Reason Required', 'Please provide a valid rejection rationale.', 'alert');
      return;
    }

    const decision: ApprovalDecision = {
      id: `REJ-${Date.now().toString().slice(-6)}`,
      decisionBy: currentUser.name,
      decisionRole: currentUser.role,
      decisionDate: new Date().toISOString(),
      status: 'Rejected',
      reason: rejectionReason,
      comments: rejectionReason,
    };

    const updatedApp: LoanApplication = {
      ...selectedApp,
      approval: decision,
      status: 'Rejected',
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          role: currentUser.role,
          action: 'Application Rejected',
          details: `Rejected by Credit Manager: ${rejectionReason}`,
          previousStatus: 'Pending Approval',
          newStatus: 'Rejected',
        },
        ...selectedApp.auditTrail,
      ],
    };

    storage.saveApplication(updatedApp);
    setShowRejectModal(false);
    setRejectionReason('');
    showToast('Application Rejected', `Application ${selectedApp.id} has been rejected.`, 'alert');
  };

  const handleRequestInfo = () => {
    if (!selectedApp) return;

    const updatedApp: LoanApplication = {
      ...selectedApp,
      status: 'Credit Assessment',
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          role: currentUser.role,
          action: 'Information Requested',
          details: 'Credit Manager returned file to Credit Analyst requesting additional clarification.',
          previousStatus: 'Pending Approval',
          newStatus: 'Credit Assessment',
        },
        ...selectedApp.auditTrail,
      ],
    };

    storage.saveApplication(updatedApp);
    showToast('File Returned', 'Application returned to Credit Analyst desk for review.', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Manager Sanction & Approval Queue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Credit Manager authorization queue for sanctioning or rejecting loan files
          </p>
        </div>

        {!canApproveApplication && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Role restriction: Only <strong>Credit Manager</strong> or <strong>System Administrator</strong> can execute sanction approvals. Switch role using the top right selector.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Approvals List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Pending Sign-off Queue</CardTitle>
            <Badge variant="cyan">{pendingApprovals.length} Files</Badge>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No files awaiting sanction approvals.
              </div>
            ) : (
              pendingApprovals.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 shadow-sm'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{app.id}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {app.loanDetails.product}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {app.applicant.fullName}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrencyINR(app.assessment?.recommendedAmount || app.loanDetails.requestedAmount)}
                      </span>
                      <span>{app.branch.split(' - ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right: Decision Workbench */}
        {selectedApp ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Header File Details */}
            <Card className="p-5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedApp.applicant.fullName}
                    </h3>
                    <Badge variant="cyan">{selectedApp.id}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Originated by {selectedApp.assignedOfficer} at {selectedApp.branch}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/applications/${selectedApp.id}`)}
                  className="text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Full Dossier</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Applied Facility</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrencyINR(selectedApp.loanDetails.requestedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Analyst Recommendation</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrencyINR(selectedApp.assessment?.recommendedAmount || selectedApp.loanDetails.requestedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Appraised Tenure & Rate</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedApp.assessment?.recommendedTenureMonths || selectedApp.loanDetails.tenureMonths}m @{' '}
                    {selectedApp.assessment?.recommendedInterestRate || selectedApp.loanDetails.interestRate}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Appraising Underwriter</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedApp.assessment?.analystName || 'Priya Iyer'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Credit Note & Risk Rating */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Underwriting Assessment Note</CardTitle>
                <Badge variant={selectedApp.assessment?.riskCategory === 'Low Risk' ? 'success' : 'warning'}>
                  {selectedApp.assessment?.riskCategory || 'Low Risk'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedApp.assessment?.remarks ||
                    'Standard underwriting appraisal conducted. Repayment history and bank credits indicate solid debt servicing capability.'}
                </p>

                {/* Authority Decision Action Bar */}
                {canApproveApplication ? (
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestInfo}
                      className="text-xs text-slate-600 dark:text-slate-300"
                    >
                      <HelpCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Request More Info</span>
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowRejectModal(true)}
                      className="text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Reject Application</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowApproveModal(true)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Sanction & Approve File</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 text-center rounded-xl text-slate-500 text-xs">
                    You are logged in as <strong>{currentUser.role}</strong>. Please switch role to <strong>Credit Manager</strong> in the top header to record sanction decisions.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-400">
            No pending files selected.
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Sanction Authorization"
        description="Issue formal credit sanction for this loan origination file."
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            You are approving loan application <strong className="text-teal-600">{selectedApp?.id}</strong> for{' '}
            <strong>{selectedApp?.applicant.fullName}</strong>.
          </p>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
              Sanction Conditions / Notes
            </label>
            <textarea
              rows={3}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm Sanction
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Loan Application"
        description="Mandatory underwriting justification must be recorded for regulatory credit audits."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
              Mandatory Adverse Credit Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              placeholder="State the regulatory policy or risk reason (e.g. Excessive obligations, negative bureau remarks)..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
