import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  Building2,
  Eye,
  Check,
  Send,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { DisbursementDetails, LoanApplication } from '../../types';
import { formatCurrencyINR, formatDateIndian, formatDateTimeIndian } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';

export const DisbursementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, canDisburseLoan } = useAuth();
  const { showToast } = usePwa();

  const [applications, setApplications] = useState<LoanApplication[]>(() => storage.getApplications());
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  const [checklist, setChecklist] = useState({
    loanAgreementSigned: true,
    nachMandateRegistered: true,
    insuranceEnrolled: true,
    originalDocsVerified: true,
  });

  const [paymentMode, setPaymentMode] = useState<'RTGS' | 'NEFT' | 'IMPS'>('RTGS');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('XXXXXX9182');
  const [beneficiaryBank, setBeneficiaryBank] = useState('State Bank of India');
  const [beneficiaryIFSC, setBeneficiaryIFSC] = useState('SBIN0000001');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  const readyQueue = applications.filter((a) => a.status === 'Ready for Disbursement');
  const selectedApp = applications.find((a) => a.id === selectedAppId) || readyQueue[0];

  const handleExecuteDisbursement = () => {
    if (!selectedApp) return;

    if (!checklist.loanAgreementSigned || !checklist.nachMandateRegistered) {
      showToast('Checklist Incomplete', 'Loan Agreement and NACH mandate must be verified prior to fund release.', 'alert');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const utr = `UTRIB26300${Math.floor(100000 + Math.random() * 900000)}`;
      const disbAmount = selectedApp.approval?.approvedAmount || selectedApp.loanDetails.requestedAmount;

      const details: DisbursementDetails = {
        disbursementId: `DISB-${Date.now().toString().slice(-6)}`,
        disbursedAmount: disbAmount,
        disbursedAt: new Date().toISOString(),
        disbursedBy: currentUser.name,
        utrNumber: utr,
        paymentMode,
        beneficiaryAccount,
        beneficiaryBank,
        beneficiaryIFSC,
        checklist,
      };

      const updatedApp: LoanApplication = {
        ...selectedApp,
        disbursement: details,
        status: 'Disbursed',
        auditTrail: [
          {
            id: `AUD-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            performedBy: currentUser.name,
            role: currentUser.role,
            action: 'Loan Disbursed',
            details: `Sanctioned amount of ${formatCurrencyINR(disbAmount)} disbursed via ${paymentMode} (UTR: ${utr}) to ${beneficiaryBank} ${beneficiaryAccount}.`,
            previousStatus: 'Ready for Disbursement',
            newStatus: 'Disbursed',
          },
          ...selectedApp.auditTrail,
        ],
      };

      storage.saveApplication(updatedApp);
      setIsProcessing(false);
      setShowConfirmModal(false);
      showToast('Disbursement Executed', `Funds released. Transaction UTR: ${utr}`, 'success');
    }, 700);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Disbursement Operations Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clear pre-disbursement conditions and execute simulated NEFT/RTGS fund transfers
          </p>
        </div>

        {!canDisburseLoan && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Role restriction: Only <strong>Operations Manager</strong> or <strong>System Administrator</strong> can execute disbursements. Switch role in top header to test.
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ready Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Ready for Fund Release</CardTitle>
            <Badge variant="success">{readyQueue.length} Files</Badge>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
            {readyQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No approved files currently waiting in the disbursement pipeline.
              </div>
            ) : (
              readyQueue.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                const sanctionedAmount = app.approval?.approvedAmount || app.loanDetails.requestedAmount;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
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
                      <span className="font-semibold text-emerald-600">
                        {formatCurrencyINR(sanctionedAmount)}
                      </span>
                      <span>{app.branch.split(' - ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right: Disbursement Execution Desk */}
        {selectedApp ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Applicant Summary */}
            <Card className="p-5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedApp.applicant.fullName}
                    </h3>
                    <Badge variant="primary">{selectedApp.id}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Branch: {selectedApp.branch} • Sanctioned by {selectedApp.approval?.decisionBy || 'Western Regional Office'}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/applications/${selectedApp.id}`)}
                  className="text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Dossier</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Approved Amount</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrencyINR(selectedApp.approval?.approvedAmount || selectedApp.loanDetails.requestedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Product / Scheme</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedApp.loanDetails.product}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sanction Date</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDateIndian(selectedApp.approval?.decisionDate || selectedApp.updatedAt)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Pre-disbursement Checklist Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pre-Disbursement Operations Checklist</CardTitle>
                <Badge variant="cyan">Regulatory Compliance</Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.loanAgreementSigned}
                      onChange={(e) => setChecklist({ ...checklist, loanAgreementSigned: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Stamped Loan Agreement Signed
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.nachMandateRegistered}
                      onChange={(e) => setChecklist({ ...checklist, nachMandateRegistered: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      e-NACH Mandate Registered
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.insuranceEnrolled}
                      onChange={(e) => setChecklist({ ...checklist, insuranceEnrolled: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Credit Shield Life Insurance Enrolled
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.originalDocsVerified}
                      onChange={(e) => setChecklist({ ...checklist, originalDocsVerified: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Original Security Docs in Safe Vault
                    </span>
                  </label>
                </div>

                {/* Bank Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                      Payment Rail
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="RTGS">RTGS (High Value Fast Track)</option>
                      <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                      <option value="IMPS">IMPS (Immediate Payment)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                      Beneficiary Account (Masked)
                    </label>
                    <input
                      type="text"
                      value={beneficiaryAccount}
                      onChange={(e) => setBeneficiaryAccount(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                      Beneficiary Bank & IFSC
                    </label>
                    <input
                      type="text"
                      value={`${beneficiaryBank} (${beneficiaryIFSC})`}
                      onChange={(e) => setBeneficiaryBank(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Action release button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  {canDisburseLoan ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowConfirmModal(true)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>Release Sanction Funds ({paymentMode})</span>
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Switch to <strong>Operations Manager</strong> role to execute disbursement.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-400">
            No pending files selected.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Loan Disbursal"
        description="Verify fund transfer instructions before initiating core banking transaction."
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            You are about to transfer{' '}
            <strong className="text-emerald-600 text-sm">
              {formatCurrencyINR(selectedApp?.approval?.approvedAmount || selectedApp?.loanDetails.requestedAmount)}
            </strong>{' '}
            to applicant <strong>{selectedApp?.applicant.fullName}</strong> via {paymentMode}.
          </p>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            Demo notice: Simulated fund release generates a realistic UTR number and records audit event in the local pipeline.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              onClick={handleExecuteDisbursement}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm & Release Funds
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
