import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  CreditCard,
  IndianRupee,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  Save,
  Check,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { calculateEMI, calculateFOIR, formatCurrencyINR } from '../../lib/utils';
import { storage } from '../../lib/storage';
import { LoanApplication, LoanProduct } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';
import { MOCK_BRANCHES } from '../../mocks/seedData';

// Zod Schema for Multi-Step Form
const applicationSchema = z.object({
  // Step 1: Applicant Information
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  mobile: z.string().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email('Enter a valid email address'),
  currentAddress: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter valid 6-digit Indian PIN code'),
  employmentType: z.enum(['Salaried', 'Self-Employed Professional', 'Self-Employed Business', 'Agriculture']),
  employerOrBusinessName: z.string().min(2, 'Employer or enterprise name is required'),
  vintageYears: z.coerce.number().min(0, 'Vintage must be 0 or more years'),

  // Step 2: Loan Details
  product: z.enum(['Personal Loan', 'Business Loan', 'Loan Against Property', 'Gold Loan']),
  requestedAmount: z.coerce.number().min(50000, 'Minimum loan amount is ₹ 50,000').max(50000000, 'Maximum is ₹ 5 Crore'),
  tenureMonths: z.coerce.number().min(6, 'Minimum tenure is 6 months').max(240, 'Maximum tenure is 240 months'),
  interestRate: z.coerce.number().min(8, 'Interest rate cannot be below 8%').max(28, 'Interest rate cannot exceed 28%'),
  purpose: z.string().min(4, 'Please state the primary purpose of the loan'),
  repaymentFrequency: z.enum(['Monthly', 'Quarterly']),
  branch: z.string().min(1, 'Please select origination branch'),

  // Step 3: Financial Details
  monthlyIncome: z.coerce.number().min(15000, 'Monthly income must be at least ₹ 15,000'),
  existingMonthlyObligations: z.coerce.number().min(0, 'Obligations cannot be negative'),
  estimatedMonthlyExpenses: z.coerce.number().min(0, 'Expenses cannot be negative'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const DRAFT_STORAGE_KEY = 'unity_los_wizard_draft_v1';

export const NewApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = usePwa();

  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<LoanApplication | null>(null);

  // Mock Upload Documents State
  const [documentsState, setDocumentsState] = useState([
    { type: 'Identity Proof (PAN Card)', fileName: '', uploaded: false },
    { type: 'Address Proof (Aadhaar / Passport / Utility)', fileName: '', uploaded: false },
    { type: 'Income Proof (Salary Slips / ITR)', fileName: '', uploaded: false },
    { type: 'Bank Statement (Last 6 Months)', fileName: '', uploaded: false },
    { type: 'Photograph', fileName: '', uploaded: false },
  ]);

  // Default values or loaded from local draft
  const defaultValues: Partial<ApplicationFormData> = {
    fullName: '',
    dob: '1992-04-15',
    gender: 'Male',
    mobile: '+91 98201 12345',
    email: 'applicant.demo@samplemail.in',
    currentAddress: 'Flat 304, Green Heights, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    employmentType: 'Salaried',
    employerOrBusinessName: 'Reliance Industries Ltd',
    vintageYears: 5,
    product: 'Personal Loan',
    requestedAmount: 1000000,
    tenureMonths: 48,
    interestRate: 11.5,
    purpose: 'Home Renovation & Modernization',
    repaymentFrequency: 'Monthly',
    branch: currentUser.branch.includes('Branch') ? currentUser.branch : 'Mumbai - Fort Branch',
    monthlyIncome: 120000,
    existingMonthlyObligations: 15000,
    estimatedMonthlyExpenses: 35000,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: () => {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        try {
          return { ...defaultValues, ...JSON.parse(draft) };
        } catch {
          return defaultValues;
        }
      }
      return defaultValues;
    },
    mode: 'onBlur',
  });

  const formValues = watch();

  // Watch for EMI and FOIR calculations
  const calculatedEMI = calculateEMI(
    Number(formValues.requestedAmount) || 0,
    Number(formValues.interestRate) || 0,
    Number(formValues.tenureMonths) || 12
  );

  const calculatedFOIR = calculateFOIR(
    Number(formValues.monthlyIncome) || 1,
    Number(formValues.existingMonthlyObligations) || 0,
    calculatedEMI
  );

  // Auto-save draft
  const saveDraft = () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formValues));
    showToast('Draft Saved', 'Application draft safely persisted to local device storage.', 'info');
  };

  const handleDocumentMockUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentsState((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          fileName: file.name,
          uploaded: true,
        };
        return next;
      });
      showToast('Document Attached', `${file.name} selected for demo upload.`, 'success');
    }
  };

  // Step Validation Gatekeeper
  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger([
        'fullName',
        'dob',
        'gender',
        'mobile',
        'email',
        'currentAddress',
        'city',
        'state',
        'pincode',
        'employmentType',
        'employerOrBusinessName',
        'vintageYears',
      ]);
    } else if (currentStep === 2) {
      isValid = await trigger([
        'product',
        'requestedAmount',
        'tenureMonths',
        'interestRate',
        'purpose',
        'repaymentFrequency',
        'branch',
      ]);
    } else if (currentStep === 3) {
      isValid = await trigger(['monthlyIncome', 'existingMonthlyObligations', 'estimatedMonthlyExpenses']);
    } else if (currentStep === 4) {
      // Step 4 is documents
      isValid = true;
    }

    if (isValid) {
      saveDraft();
      setCurrentStep((s) => s + 1);
    }
  };

  // Final Form Submit Execution
  const onSubmit = (data: ApplicationFormData) => {
    setShowConfirmModal(true);
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const existingApps = storage.getApplications();
      const nextNum = existingApps.length + 1;
      const formattedNum = nextNum.toString().padStart(4, '0');
      const newAppId = `ULOS-2026-${formattedNum}`;
      const customerId = `CUST-2026-${(3000 + nextNum).toString()}`;

      const newApplication: LoanApplication = {
        id: newAppId,
        customerId,
        applicant: {
          fullName: formValues.fullName,
          dob: formValues.dob,
          gender: formValues.gender,
          mobile: formValues.mobile,
          email: formValues.email,
          currentAddress: formValues.currentAddress,
          city: formValues.city,
          state: formValues.state,
          pincode: formValues.pincode,
          employmentType: formValues.employmentType,
          employerOrBusinessName: formValues.employerOrBusinessName,
          vintageYears: Number(formValues.vintageYears) || 0,
        },
        loanDetails: {
          product: formValues.product,
          requestedAmount: Number(formValues.requestedAmount),
          tenureMonths: Number(formValues.tenureMonths),
          interestRate: Number(formValues.interestRate),
          purpose: formValues.purpose,
          repaymentFrequency: formValues.repaymentFrequency,
          estimatedEMI: calculatedEMI,
        },
        financialDetails: {
          monthlyIncome: Number(formValues.monthlyIncome),
          existingMonthlyObligations: Number(formValues.existingMonthlyObligations),
          estimatedMonthlyExpenses: Number(formValues.estimatedMonthlyExpenses),
          netMonthlySurplus:
            Number(formValues.monthlyIncome) -
            (Number(formValues.existingMonthlyObligations) + Number(formValues.estimatedMonthlyExpenses)),
        },
        documents: documentsState.map((d, i) => ({
          id: `DOC-NEW-${i + 1}`,
          type: d.type as any,
          fileName: d.fileName || 'demo_document.pdf',
          fileSize: d.uploaded ? '1.5 MB' : '1.2 MB',
          status: 'Received',
          uploadedAt: new Date().toISOString(),
        })),
        branch: formValues.branch,
        assignedOfficer: currentUser.name,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        auditTrail: [
          {
            id: `AUD-NEW-1`,
            timestamp: new Date().toISOString(),
            performedBy: currentUser.name,
            role: currentUser.role,
            action: 'Application Submitted',
            details: `New ${formValues.product} application registered with requested sanction of ${formatCurrencyINR(
              Number(formValues.requestedAmount)
            )}.`,
            newStatus: 'Submitted',
          },
        ],
      };

      // Persist in store
      storage.saveApplication(newApplication);

      // Add to Customer Directory
      storage.saveCustomer({
        id: customerId,
        fullName: formValues.fullName,
        email: formValues.email,
        mobile: formValues.mobile,
        city: formValues.city,
        state: formValues.state,
        branch: formValues.branch,
        employmentType: formValues.employmentType,
        employer: formValues.employerOrBusinessName,
        panMasked: 'ABCDE****Z',
        aadhaarMasked: '****-****-9012',
        createdAt: new Date().toISOString().split('T')[0],
        totalApplications: 1,
        activeLoansCount: 0,
        totalBorrowedAmount: Number(formValues.requestedAmount),
        cibilScore: 745,
        tags: ['New Applicant', formValues.product],
      });

      // Clear draft
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      setSubmissionSuccess(newApplication);
      showToast('Application Lodged', `Application ${newAppId} created successfully.`, 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Applicant Information', icon: User },
    { number: 2, title: 'Loan Details', icon: CreditCard },
    { number: 3, title: 'Financial Appraisal', icon: IndianRupee },
    { number: 4, title: 'Document Checklist', icon: FileText },
    { number: 5, title: 'Review & Submit', icon: CheckCircle2 },
  ];

  // Success Screen After Submission
  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-200">
        <Card className="text-center p-8 border-teal-500/30 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Application Submitted Successfully!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Loan file has been originated and entered into the Unity LOS underwriting pipeline.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Application Reference ID:</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">{submissionSuccess.id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {submissionSuccess.applicant.fullName}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Sanction Requested:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrencyINR(submissionSuccess.loanDetails.requestedAmount)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Current Stage:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {submissionSuccess.status} (Ready for Document Scrutiny)
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/applications')}>
              View Applications Pipeline
            </Button>
            <Button variant="primary" onClick={() => navigate(`/applications/${submissionSuccess.id}`)}>
              Open Application Details
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            New Loan Origination Wizard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Step {currentStep} of 5 — Multi-stage KYC, credit assessment, and document capture
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={saveDraft} className="text-xs gap-1.5">
          <Save className="w-3.5 h-3.5 text-teal-600" />
          <span>Save Draft</span>
        </Button>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div
                key={s.number}
                className="flex flex-col items-center text-center cursor-pointer select-none"
                onClick={() => {
                  if (currentStep > s.number) setCurrentStep(s.number);
                }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-2 border-teal-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 hidden sm:block truncate w-full ${
                    isCurrent ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Form Cards */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STEP 1: Applicant Information */}
        {currentStep === 1 && (
          <Card className="animate-in fade-in duration-200">
            <CardHeader>
              <div>
                <CardTitle>Step 1: Primary Applicant Information</CardTitle>
                <p className="text-xs text-slate-500">Demographic, contact, and employment credentials</p>
              </div>
              <Badge variant="primary">KYC Capture</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Ramesh Chandra Verma"
                  />
                  {errors.fullName && <p className="text-[11px] text-rose-500 mt-1">{errors.fullName.message}</p>}
                </div>

                {/* DOB & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      {...register('dob')}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.dob && <p className="text-[11px] text-rose-500 mt-1">{errors.dob.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender *
                    </label>
                    <select
                      {...register('gender')}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (+91) *
                  </label>
                  <input
                    type="tel"
                    {...register('mobile')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="+91 98201 12345"
                  />
                  {errors.mobile && <p className="text-[11px] text-rose-500 mt-1">{errors.mobile.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="applicant@example.com"
                  />
                  {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>}
                </div>

                {/* Current Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current Residential Address *
                  </label>
                  <input
                    type="text"
                    {...register('currentAddress')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Flat / House No, Building, Street, Area"
                  />
                  {errors.currentAddress && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.currentAddress.message}</p>
                  )}
                </div>

                {/* City, State, Pincode */}
                <div className="sm:col-span-2 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.city && <p className="text-[11px] text-rose-500 mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State *</label>
                    <input
                      type="text"
                      {...register('state')}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {errors.state && <p className="text-[11px] text-rose-500 mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PIN *</label>
                    <input
                      type="text"
                      {...register('pincode')}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="400001"
                    />
                    {errors.pincode && <p className="text-[11px] text-rose-500 mt-1">{errors.pincode.message}</p>}
                  </div>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employment Type *
                  </label>
                  <select
                    {...register('employmentType')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Salaried">Salaried (MNC / Corporate / Govt)</option>
                    <option value="Self-Employed Professional">Self-Employed Professional (Doctor / CA / Lawyer)</option>
                    <option value="Self-Employed Business">Self-Employed Business / MSME</option>
                    <option value="Agriculture">Agriculture / Allied Activities</option>
                  </select>
                </div>

                {/* Employer / Business Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employer or Business Name *
                  </label>
                  <input
                    type="text"
                    {...register('employerOrBusinessName')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Tata Motors / Self Firm"
                  />
                  {errors.employerOrBusinessName && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.employerOrBusinessName.message}</p>
                  )}
                </div>

                {/* Vintage Years */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employment / Business Vintage (Years) *
                  </label>
                  <input
                    type="number"
                    {...register('vintageYears')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="5"
                  />
                  {errors.vintageYears && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.vintageYears.message}</p>
                  )}
                </div>
              </div>

              {/* Privacy Warning */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>
                  Demo Disclaimer: Never enter real Aadhaar numbers, PAN card numbers, or confidential customer credentials in this demonstration system.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Loan Details */}
        {currentStep === 2 && (
          <Card className="animate-in fade-in duration-200">
            <CardHeader>
              <div>
                <CardTitle>Step 2: Loan Product & Sanction Parameters</CardTitle>
                <p className="text-xs text-slate-500">Configure requested amount, tenure, and repayment options</p>
              </div>
              <Badge variant="primary">Credit Facility</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loan Product Category *
                  </label>
                  <select
                    {...register('product')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Personal Loan">Personal Loan (Unsecured)</option>
                    <option value="Business Loan">Business Loan (MSME Expansion)</option>
                    <option value="Loan Against Property">Loan Against Property (LAP)</option>
                    <option value="Gold Loan">Gold Loan (Priority Sector)</option>
                  </select>
                </div>

                {/* Origination Branch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Origination Branch *
                  </label>
                  <select
                    {...register('branch')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {MOCK_BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Requested Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Requested Sanction Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="50000"
                    {...register('requestedAmount')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="1000000"
                  />
                  {errors.requestedAmount && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.requestedAmount.message}</p>
                  )}
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-1">
                    In words: {formatCurrencyINR(Number(formValues.requestedAmount) || 0)}
                  </p>
                </div>

                {/* Tenure */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    {...register('tenureMonths')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="48"
                  />
                  {errors.tenureMonths && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.tenureMonths.message}</p>
                  )}
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interest Rate Assumption (% p.a.) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    {...register('interestRate')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="11.5"
                  />
                  {errors.interestRate && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.interestRate.message}</p>
                  )}
                </div>

                {/* Repayment Frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Repayment Frequency *
                  </label>
                  <select
                    {...register('repaymentFrequency')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Monthly">Monthly Installment (Standard EMI)</option>
                    <option value="Quarterly">Quarterly Installment (Agricultural / MSME)</option>
                  </select>
                </div>

                {/* Purpose */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End-Use Loan Purpose *
                  </label>
                  <input
                    type="text"
                    {...register('purpose')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. Home Renovation, Commercial Inventory Stocking, Machinery"
                  />
                  {errors.purpose && <p className="text-[11px] text-rose-500 mt-1">{errors.purpose.message}</p>}
                </div>
              </div>

              {/* Calculated EMI Display Callout */}
              <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-teal-800 dark:text-teal-300">Estimated Monthly EMI</p>
                  <p className="text-xl font-bold text-teal-700 dark:text-teal-200 mt-0.5">
                    {formatCurrencyINR(calculatedEMI)} / month
                  </p>
                  <p className="text-[11px] text-teal-600/80 dark:text-teal-400">
                    Calculated at {formValues.interestRate}% p.a. for {formValues.tenureMonths} months
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500">Standard reducing balance calculation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Financial Details */}
        {currentStep === 3 && (
          <Card className="animate-in fade-in duration-200">
            <CardHeader>
              <div>
                <CardTitle>Step 3: Income & Financial Appraisal</CardTitle>
                <p className="text-xs text-slate-500">Repayment capacity and Debt-to-Income / FOIR appraisal</p>
              </div>
              <Badge variant="primary">Underwriting Capacity</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Monthly Income */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Net Monthly Income (₹) *
                  </label>
                  <input
                    type="number"
                    step="5000"
                    {...register('monthlyIncome')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="120000"
                  />
                  {errors.monthlyIncome && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.monthlyIncome.message}</p>
                  )}
                </div>

                {/* Existing Obligations */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Existing Monthly EMIs / Obligations (₹) *
                  </label>
                  <input
                    type="number"
                    step="2000"
                    {...register('existingMonthlyObligations')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="15000"
                  />
                  {errors.existingMonthlyObligations && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.existingMonthlyObligations.message}</p>
                  )}
                </div>

                {/* Estimated Monthly Expenses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Living Expenses (₹) *
                  </label>
                  <input
                    type="number"
                    step="2000"
                    {...register('estimatedMonthlyExpenses')}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="35000"
                  />
                  {errors.estimatedMonthlyExpenses && (
                    <p className="text-[11px] text-rose-500 mt-1">{errors.estimatedMonthlyExpenses.message}</p>
                  )}
                </div>
              </div>

              {/* Dynamic FOIR & Surplus Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  className={`p-4 rounded-xl border ${
                    calculatedFOIR <= 50
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Fixed Obligation Ratio (FOIR)</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      calculatedFOIR <= 50 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {calculatedFOIR}%
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {calculatedFOIR <= 50
                      ? 'Compliant with bank policy threshold (≤ 50%)'
                      : 'High Risk: Exceeds standard 50% policy threshold'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500">Estimated Net Monthly Surplus</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {formatCurrencyINR(
                      Number(formValues.monthlyIncome || 0) -
                        (Number(formValues.existingMonthlyObligations || 0) +
                          Number(formValues.estimatedMonthlyExpenses || 0) +
                          calculatedEMI)
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Discretionary post-EMI cash buffer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Document Checklist */}
        {currentStep === 4 && (
          <Card className="animate-in fade-in duration-200">
            <CardHeader>
              <div>
                <CardTitle>Step 4: Mandatory Document Checklist</CardTitle>
                <p className="text-xs text-slate-500">
                  Simulate local document selection for verification scanning
                </p>
              </div>
              <Badge variant="primary">Document Vault</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {documentsState.map((doc, idx) => (
                  <div key={doc.type} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{doc.type}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {doc.fileName ? `Selected: ${doc.fileName}` : 'Accepted formats: PDF, JPG, PNG (Max 5MB)'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {doc.uploaded ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="w-4 h-4" /> Attached
                        </span>
                      ) : null}

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleDocumentMockUpload(idx, e)}
                        />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-teal-600" />
                          <span>{doc.uploaded ? 'Change File' : 'Select File'}</span>
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                Notice: Uploaded files are simulated in this browser session. Official documents are verified by the operations and credit analyst desk.
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Review and Submit */}
        {currentStep === 5 && (
          <Card className="animate-in fade-in duration-200">
            <CardHeader>
              <div>
                <CardTitle>Step 5: Review Application Dossier</CardTitle>
                <p className="text-xs text-slate-500">Carefully inspect all applicant credentials prior to submission</p>
              </div>
              <Badge variant="cyan">Ready for Final Sign-off</Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Applicant Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Applicant Information
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{formValues.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formValues.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                      {formValues.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Employment</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formValues.employmentType} ({formValues.employerOrBusinessName})
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Facility Parameters
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Product</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{formValues.product}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Requested Sanction</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrencyINR(Number(formValues.requestedAmount))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tenure & Rate</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formValues.tenureMonths} Months @ {formValues.interestRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated EMI</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrencyINR(calculatedEMI)}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Underwriting Metrics */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Financial Assessment & FOIR
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Monthly Net Income</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrencyINR(Number(formValues.monthlyIncome))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fixed Obligation Ratio (FOIR)</span>
                    <span
                      className={`font-bold ${
                        calculatedFOIR <= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {calculatedFOIR}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Origination Branch</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formValues.branch}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => s - 1)}
            className="text-xs gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </Button>

          {currentStep < 5 ? (
            <Button type="button" variant="primary" size="md" onClick={handleNextStep} className="text-xs gap-1.5">
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/30 font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Loan Application</span>
            </Button>
          )}
        </div>
      </form>

      {/* Confirmation Modal Before Submission */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Application Submission"
        description="Please confirm submission of this demo loan origination dossier."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You are about to register application for{' '}
            <strong className="text-slate-900 dark:text-slate-100">{formValues.fullName}</strong> for{' '}
            <strong className="text-teal-600 dark:text-teal-400">{formatCurrencyINR(Number(formValues.requestedAmount))}</strong>{' '}
            under <strong className="text-slate-900 dark:text-slate-100">{formValues.product}</strong>.
          </p>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            A new application ID will be generated and assigned to {currentUser.name} at {formValues.branch}.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={executeSubmission}
              className="shadow-md shadow-teal-600/20"
            >
              Confirm & Originate File
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
