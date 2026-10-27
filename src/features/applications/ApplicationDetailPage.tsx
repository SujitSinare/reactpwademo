import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Calculator,
  ShieldCheck,
  Banknote,
  Clock,
  History,
  AlertTriangle,
  Building2,
  Calendar,
  IndianRupee,
  ChevronRight,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { LoanApplication, ApplicationStatus } from '../../types';
import { formatCurrencyINR, formatDateIndian, formatDateTimeIndian, getStatusBadgeClass } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, canVerifyDocuments, canPerformCreditAssessment, canApproveApplication, canDisburseLoan } = useAuth();
  const { showToast } = usePwa();

  const [application, setApplication] = useState<LoanApplication | undefined>(() => {
    return id ? storage.getApplicationById(id) : undefined;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'credit' | 'approval' | 'disbursement' | 'audit'>('overview');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Re-sync on storage changes
  useEffect(() => {
    return storage.subscribe(() => {
      if (id) {
        setApplication(storage.getApplicationById(id));
      }
    });
  }, [id]);

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Application Not Found</h3>
        <p className="text-xs text-slate-500">The requested loan dossier does not exist or may have been deleted.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/applications')}>
          Return to Applications
        </Button>
      </div>
    );
  }

  const badge = getStatusBadgeClass(application.status);

  // Transition Helpers
  const handleTransition = (nextStatus: ApplicationStatus, details: string) => {
    const updated = storage.updateApplicationStatus(
      application.id,
      nextStatus,
      currentUser.name,
      currentUser.role,
      details
    );
    if (updated) {
      setApplication({ ...updated });
      showToast('Status Updated', `Application moved to ${nextStatus}.`, 'success');
    }
  };

  const handleDocumentVerify = (docId: string, status: 'Verified' | 'Rejected') => {
    const nextDocs = application.documents.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          status,
          verifiedAt: new Date().toISOString(),
          verifiedBy: currentUser.name,
          remarks: status === 'Verified' ? 'Document scrutinized & approved' : 'Discrepancy observed',
        };
      }
      return d;
    });

    const updatedApp: LoanApplication = {
      ...application,
      documents: nextDocs,
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          role: currentUser.role,
          action: `Document ${status}`,
          details: `${nextDocs.find((d) => d.id === docId)?.type} marked as ${status}`,
        },
        ...application.auditTrail,
      ],
    };

    storage.saveApplication(updatedApp);
    setApplication(updatedApp);
    showToast('Document Status Updated', `Document marked as ${status}.`, 'info');
  };

  const handleExecuteRejection = () => {
    if (!rejectionReason.trim()) {
      showToast('Mandatory Reason Required', 'Please provide an underwriting rationale for rejecting this application.', 'alert');
      return;
    }
    const updatedApp: LoanApplication = {
      ...application,
      status: 'Rejected',
      approval: {
        id: `REJ-${Date.now().toString().slice(-6)}`,
        decisionBy: currentUser.name,
        decisionRole: currentUser.role,
        decisionDate: new Date().toISOString(),
        status: 'Rejected',
        reason: rejectionReason,
        comments: `Rejected by ${currentUser.name} (${currentUser.role}): ${rejectionReason}`,
      },
    };
    storage.saveApplication(updatedApp);
    storage.updateApplicationStatus(
      application.id,
      'Rejected',
      currentUser.name,
      currentUser.role,
      `Rejected with reason: ${rejectionReason}`
    );
    setRejectModalOpen(false);
    setRejectionReason('');
    showToast('Application Rejected', `Application ${application.id} rejected.`, 'alert');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/applications')}
            className="p-2 h-9 w-9 text-slate-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{application.id}</h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {application.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {application.applicant.fullName} • {application.loanDetails.product} • Applied on{' '}
              {formatDateIndian(application.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 flex-1 sm:flex-initial"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </Button>

          {/* Contextual Workflow Action Buttons Based on Role */}
          {application.status === 'Submitted' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleTransition('Document Verification', 'Forwarded to verification desk')}
              className="text-xs gap-1.5 shadow-md shadow-teal-600/20"
            >
              <span>Initiate Doc Verification</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {application.status === 'Document Verification' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleTransition('Credit Assessment', 'Documents verified, forwarded for credit appraisal')}
              className="text-xs gap-1.5 shadow-md shadow-teal-600/20"
            >
              <span>Proceed to Credit Assessment</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {application.status === 'Credit Assessment' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleTransition('Pending Approval', 'Credit underwriting complete, awaiting Credit Manager sanction')}
              className="text-xs gap-1.5 shadow-md shadow-teal-600/20"
            >
              <span>Submit for Approval</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}

          {application.status === 'Pending Approval' && canApproveApplication && (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setRejectModalOpen(true)}
                className="text-xs"
              >
                Reject File
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleTransition('Ready for Disbursement', 'Loan Sanction approved by Credit Manager')}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                Approve & Sanction
              </Button>
            </div>
          )}

          {application.status === 'Ready for Disbursement' && canDisburseLoan && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/disbursement')}
              className="text-xs bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20"
            >
              <Banknote className="w-3.5 h-3.5 mr-1" />
              <span>Execute Disbursal</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-50/60 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 block">Requested Amount</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrencyINR(application.loanDetails.requestedAmount)}
          </span>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 block mt-0.5">
            {application.loanDetails.tenureMonths} Months @ {application.loanDetails.interestRate}% p.a.
          </span>
        </Card>

        <Card className="p-4 bg-slate-50/60 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 block">Estimated EMI</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrencyINR(application.loanDetails.estimatedEMI)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Monthly Installment</span>
        </Card>

        <Card className="p-4 bg-slate-50/60 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 block">Monthly Net Income</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {formatCurrencyINR(application.financialDetails.monthlyIncome)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Surplus: {formatCurrencyINR(application.financialDetails.netMonthlySurplus)}
          </span>
        </Card>

        <Card className="p-4 bg-slate-50/60 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 block">Branch & Officer</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
            {application.branch}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{application.assignedOfficer}</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-print">
        {[
          { id: 'overview', label: 'Applicant & KYC', icon: User },
          { id: 'documents', label: `Documents (${application.documents.length})`, icon: FileText },
          { id: 'credit', label: 'Credit Assessment', icon: Calculator },
          { id: 'approval', label: 'Sanction & Approvals', icon: ShieldCheck },
          { id: 'disbursement', label: 'Disbursement Hub', icon: Banknote },
          { id: 'audit', label: `Audit Trail (${application.auditTrail.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Demographic & Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{application.applicant.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Birth / Gender</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDateIndian(application.applicant.dob)} ({application.applicant.gender})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mobile</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{application.applicant.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{application.applicant.email}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Residential Address</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {application.applicant.currentAddress}, {application.applicant.city}, {application.applicant.state} -{' '}
                    {application.applicant.pincode}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Employment & Financial Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Employment Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {application.applicant.employmentType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Employer / Business Vintage</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {application.applicant.employerOrBusinessName} ({application.applicant.vintageYears} yrs)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Net Monthly Income</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrencyINR(application.financialDetails.monthlyIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Existing Debt Obligations</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrencyINR(application.financialDetails.existingMonthlyObligations)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Monthly Living Expenses</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrencyINR(application.financialDetails.estimatedMonthlyExpenses)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Loan End-Use Purpose</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {application.loanDetails.purpose}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 2: Document Verification */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-sm">Document Verification Checklist</CardTitle>
              <p className="text-xs text-slate-400">Review KYC proofs, tax returns, and bank statements</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Verification Remarks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {application.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{doc.type}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {doc.fileName ? (
                          <span className="text-teal-600 dark:text-teal-400 font-medium">{doc.fileName}</span>
                        ) : (
                          <span className="text-amber-500 font-medium">Pending Upload</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
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
                          dot
                        >
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {doc.remarks || 'No remarks recorded'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canVerifyDocuments && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700"
                              onClick={() => handleDocumentVerify(doc.id, 'Verified')}
                            >
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700"
                              onClick={() => handleDocumentVerify(doc.id, 'Rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 3: Credit Assessment */}
      {activeTab === 'credit' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-sm">Underwriting & Credit Assessment</CardTitle>
              <p className="text-xs text-slate-400">Risk rating, FOIR threshold checks, and analyst recommendations</p>
            </div>
            {application.assessment && (
              <Badge variant={application.assessment.riskCategory === 'Low Risk' ? 'success' : 'warning'}>
                {application.assessment.riskCategory}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {application.assessment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CIBIL Bureau Score</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {application.assessment.cibilScore} / 900
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Appraised FOIR</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {application.assessment.foir}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Recommended Sanction</span>
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrencyINR(application.assessment.recommendedAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Appraising Analyst</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {application.assessment.analystName}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Underwriter Rationale</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {application.assessment.remarks}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <p className="text-slate-500">Credit appraisal has not yet been logged for this application.</p>
                {canPerformCreditAssessment && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/credit-assessment')}
                  >
                    Open Credit Assessment Workbench
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 4: Sanction & Approvals */}
      {activeTab === 'approval' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sanction Decision & Authority Sign-off</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {application.approval ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Decision: {application.approval.status}
                  </span>
                  <span className="text-slate-400 text-[11px]">{formatDateTimeIndian(application.approval.decisionDate)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{application.approval.comments}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-400 text-[11px]">
                  Authorized By: {application.approval.decisionBy} ({application.approval.decisionRole})
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500">
                Awaiting final Credit Manager approval decision.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 5: Disbursement */}
      {activeTab === 'disbursement' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Disbursement Details</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-3">
            {application.disbursement ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Disbursed Amount</span>
                    <span className="text-base font-bold text-emerald-600">
                      {formatCurrencyINR(application.disbursement.disbursedAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">UTR / Reference Number</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {application.disbursement.utrNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Payment Mode</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {application.disbursement.paymentMode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Disbursed At</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDateTimeIndian(application.disbursement.disbursedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500">
                Loan has not yet been disbursed. Pre-disbursement checklist must be cleared first.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT 6: Audit Trail */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Application Audit Trail & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {application.auditTrail.map((ev, i) => (
              <div key={ev.id || i} className="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-none">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{ev.action}</p>
                    <span className="text-[10px] text-slate-400">{formatDateTimeIndian(ev.timestamp)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{ev.details}</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    Logged by {ev.performedBy} ({ev.role})
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Loan Application"
        description="Mandatory adverse credit memo must be recorded for regulatory record."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Rejection *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State the underwriting policy breach, high FOIR, bureau delinquency, or document falsification..."
              className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleExecuteRejection}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
