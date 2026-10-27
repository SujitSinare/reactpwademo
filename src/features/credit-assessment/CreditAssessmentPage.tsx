import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Save,
  Check,
  Eye,
  Building2,
  Info,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { CreditAssessment, LoanApplication } from '../../types';
import { calculateEMI, calculateFOIR, formatCurrencyINR, formatDateIndian } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';

export const CreditAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, canPerformCreditAssessment } = useAuth();
  const { showToast } = usePwa();

  const [applications, setApplications] = useState<LoanApplication[]>(() => storage.getApplications());
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  const creditQueue = applications.filter(
    (a) => a.status === 'Credit Assessment' || a.status === 'Document Verification' || a.status === 'Submitted'
  );

  const selectedApp = applications.find((a) => a.id === selectedAppId) || creditQueue[0];

  // Appraisal Form State
  const [appraisalAmount, setAppraisalAmount] = useState<number>(0);
  const [appraisalTenure, setAppraisalTenure] = useState<number>(48);
  const [appraisalRate, setAppraisalRate] = useState<number>(11.5);
  const [cibilScore, setCibilScore] = useState<number>(750);
  const [recommendation, setRecommendation] = useState<'Recommend Approval' | 'Recommend Rejection' | 'Additional Docs Required'>('Recommend Approval');
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState({
    incomeVerified: true,
    vintageSufficient: true,
    foirWithinLimits: true,
    cibilSatisfactory: true,
    fieldInvestigationDone: true,
  });

  // Re-sync appraisal form on selected app change
  useEffect(() => {
    if (selectedApp) {
      setAppraisalAmount(selectedApp.assessment?.recommendedAmount || selectedApp.loanDetails.requestedAmount);
      setAppraisalTenure(selectedApp.assessment?.recommendedTenureMonths || selectedApp.loanDetails.tenureMonths);
      setAppraisalRate(selectedApp.assessment?.recommendedInterestRate || selectedApp.loanDetails.interestRate);
      setCibilScore(selectedApp.assessment?.cibilScore || 750);
      setRecommendation(selectedApp.assessment?.recommendation || 'Recommend Approval');
      setRemarks(
        selectedApp.assessment?.remarks ||
          `Applicant reflects clean repayment track. Net surplus adequately services proposed EMI. Recommended for sanction.`
      );
      if (selectedApp.assessment?.checklist) {
        setChecklist({ ...checklist, ...selectedApp.assessment.checklist });
      }
    }
  }, [selectedAppId]);

  if (!selectedApp) {
    return (
      <div className="p-12 text-center text-slate-500">
        No loan files currently awaiting credit underwriting.
      </div>
    );
  }

  const emi = calculateEMI(appraisalAmount, appraisalRate, appraisalTenure);
  const foir = calculateFOIR(selectedApp.financialDetails.monthlyIncome, selectedApp.financialDetails.existingMonthlyObligations, emi);

  const riskCategory = cibilScore >= 750 && foir <= 50 ? 'Low Risk' : cibilScore >= 700 && foir <= 60 ? 'Moderate Risk' : 'High Risk';

  const handleSaveAssessment = () => {
    const assessmentRecord: CreditAssessment = {
      id: `ASM-${Date.now().toString().slice(-6)}`,
      analystId: currentUser.id,
      analystName: currentUser.name,
      assessmentDate: new Date().toISOString(),
      monthlyIncome: selectedApp.financialDetails.monthlyIncome,
      existingMonthlyObligations: selectedApp.financialDetails.existingMonthlyObligations,
      proposedEMI: emi,
      foir,
      cibilScore,
      riskCategory,
      recommendedAmount: appraisalAmount,
      recommendedTenureMonths: appraisalTenure,
      recommendedInterestRate: appraisalRate,
      recommendation,
      remarks,
      checklist,
    };

    const nextStatus = recommendation === 'Recommend Approval' ? 'Pending Approval' : 'Document Verification';

    const updatedApp: LoanApplication = {
      ...selectedApp,
      assessment: assessmentRecord,
      status: nextStatus,
      auditTrail: [
        {
          id: `AUD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toISOString(),
          performedBy: currentUser.name,
          role: currentUser.role,
          action: 'Credit Assessment Completed',
          details: `Appraisal recorded with ${recommendation}. Recommended sanction ${formatCurrencyINR(appraisalAmount)} at ${appraisalRate}%. Advanced to ${nextStatus}.`,
          previousStatus: selectedApp.status,
          newStatus: nextStatus,
        },
        ...selectedApp.auditTrail,
      ],
    };

    storage.saveApplication(updatedApp);
    showToast(
      'Credit Assessment Logged',
      `Appraisal submitted for ${selectedApp.id}. File forwarded to ${nextStatus}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Credit Underwriting & Risk Assessment
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Evaluate FOIR debt capacity, simulated bureau scores, risk ratings, and analyst recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Appraisal Queue</CardTitle>
            <Badge variant="primary">{creditQueue.length} Files</Badge>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
            {creditQueue.map((app) => {
              const isSelected = selectedApp.id === app.id;
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
                    <Badge variant="outline" className="text-[10px]">
                      {app.status}
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

        {/* Right: Underwriting Form & Calculators */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Summary */}
          <Card className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedApp.applicant.fullName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applied for {formatCurrencyINR(selectedApp.loanDetails.requestedAmount)} • {selectedApp.loanDetails.product} • {selectedApp.branch}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/applications/${selectedApp.id}`)}
                className="text-xs"
              >
                Inspect Dossier
              </Button>
            </div>
          </Card>

          {/* Key Appraisal Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <Card className="p-3">
              <span className="text-slate-400 block text-[10px]">Net Income</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {formatCurrencyINR(selectedApp.financialDetails.monthlyIncome)}
              </span>
            </Card>

            <Card className="p-3">
              <span className="text-slate-400 block text-[10px]">Appraised EMI</span>
              <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                {formatCurrencyINR(emi)}/mo
              </span>
            </Card>

            <Card className="p-3">
              <span className="text-slate-400 block text-[10px]">Appraised FOIR</span>
              <span
                className={`font-bold text-sm ${
                  foir <= 50 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {foir}%
              </span>
              <span className="text-[9px] text-slate-400 block">Cap: 50%</span>
            </Card>

            <Card className="p-3">
              <span className="text-slate-400 block text-[10px]">Risk Tier</span>
              <span
                className={`font-bold text-sm ${
                  riskCategory === 'Low Risk' ? 'text-emerald-600' : riskCategory === 'Moderate Risk' ? 'text-amber-500' : 'text-rose-600'
                }`}
              >
                {riskCategory}
              </span>
            </Card>
          </div>

          {/* Underwriter Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sanction Recommendation Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                    Recommended Sanction (₹)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={appraisalAmount}
                    onChange={(e) => setAppraisalAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                    Recommended Tenure (Months)
                  </label>
                  <input
                    type="number"
                    value={appraisalTenure}
                    onChange={(e) => setAppraisalTenure(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                    Sanction Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={appraisalRate}
                    onChange={(e) => setAppraisalRate(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Bureau Score Simulator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                    Simulated CIBIL Score (300 - 900)
                  </label>
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={cibilScore}
                    onChange={(e) => setCibilScore(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Illustrative bureau simulation for demonstration</p>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                    Underwriting Decision
                  </label>
                  <select
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Recommend Approval">Recommend Approval</option>
                    <option value="Recommend Rejection">Recommend Rejection</option>
                    <option value="Additional Docs Required">Additional Docs Required</option>
                  </select>
                </div>
              </div>

              {/* Underwriter Checklist */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Credit Policy Checklist
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.incomeVerified}
                      onChange={(e) => setChecklist({ ...checklist, incomeVerified: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Income & Bank Credits Verified</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.vintageSufficient}
                      onChange={(e) => setChecklist({ ...checklist, vintageSufficient: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Business / Job Vintage ≥ 2 Yrs</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.foirWithinLimits}
                      onChange={(e) => setChecklist({ ...checklist, foirWithinLimits: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>FOIR within Policy Cap (≤ 50%)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.fieldInvestigationDone}
                      onChange={(e) => setChecklist({ ...checklist, fieldInvestigationDone: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Physical Field Verification Complete</span>
                  </label>
                </div>
              </div>

              {/* Analyst Remarks */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">
                  Analyst Rationale & Credit Memo Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="Detail applicant's banking behavior, business prospects, collateral valuation, and mitigation notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/applications')}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAssessment}
                  className="gap-1.5 shadow-md shadow-teal-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Submit Credit Appraisal</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
