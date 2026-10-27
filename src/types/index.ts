export type UserRole = 
  | 'Branch Officer' 
  | 'Credit Analyst' 
  | 'Credit Manager' 
  | 'Operations Manager' 
  | 'System Administrator';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: string;
  avatarUrl?: string;
  employeeCode: string;
}

export type LoanProduct = 
  | 'Personal Loan' 
  | 'Business Loan' 
  | 'Loan Against Property' 
  | 'Gold Loan';

export type ApplicationStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Document Verification'
  | 'Credit Assessment'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'On Hold'
  | 'Incomplete'
  | 'Cancelled'
  | 'Ready for Disbursement'
  | 'Disbursed';

export type DocumentType = 
  | 'Identity Proof (PAN Card)'
  | 'Address Proof (Aadhaar / Passport / Utility)'
  | 'Income Proof (Salary Slips / ITR)'
  | 'Bank Statement (Last 6 Months)'
  | 'Photograph'
  | 'Business Registration / GST (if applicable)';

export type DocumentStatus = 'Pending' | 'Received' | 'Verified' | 'Rejected';

export interface LoanDocument {
  id: string;
  type: DocumentType;
  fileName?: string;
  fileSize?: string;
  status: DocumentStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  remarks?: string;
}

export interface CreditAssessment {
  id: string;
  analystId: string;
  analystName: string;
  assessmentDate: string;
  monthlyIncome: number;
  existingMonthlyObligations: number;
  proposedEMI: number;
  foir: number; // Fixed Obligation to Income Ratio (DTI) %
  cibilScore: number; // Simulated Bureau Score (300-900)
  riskCategory: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  recommendedAmount: number;
  recommendedTenureMonths: number;
  recommendedInterestRate: number;
  recommendation: 'Recommend Approval' | 'Recommend Rejection' | 'Additional Docs Required';
  remarks: string;
  checklist: {
    incomeVerified: boolean;
    vintageSufficient: boolean;
    foirWithinLimits: boolean;
    cibilSatisfactory: boolean;
    propertyValuationDone?: boolean;
    fieldInvestigationDone: boolean;
  };
}

export interface ApprovalDecision {
  id: string;
  decisionBy: string;
  decisionRole: UserRole;
  decisionDate: string;
  status: 'Approved' | 'Rejected' | 'Request More Info';
  approvedAmount?: number;
  approvedTenureMonths?: number;
  approvedInterestRate?: number;
  reason?: string;
  comments: string;
}

export interface DisbursementDetails {
  disbursementId: string;
  disbursedAmount: number;
  disbursedAt: string;
  disbursedBy: string;
  utrNumber: string;
  paymentMode: 'NEFT' | 'RTGS' | 'IMPS';
  beneficiaryAccount: string; // Masked e.g. XXXXXX4821
  beneficiaryBank: string;
  beneficiaryIFSC: string;
  checklist: {
    loanAgreementSigned: boolean;
    nachMandateRegistered: boolean;
    insuranceEnrolled: boolean;
    originalDocsVerified: boolean;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  performedBy: string;
  role: UserRole;
  action: string;
  details: string;
  previousStatus?: ApplicationStatus;
  newStatus?: ApplicationStatus;
}

export interface LoanApplication {
  id: string; // e.g. ULOS-2026-0001
  customerId: string;
  applicant: {
    fullName: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    mobile: string;
    email: string;
    currentAddress: string;
    city: string;
    state: string;
    pincode: string;
    employmentType: 'Salaried' | 'Self-Employed Professional' | 'Self-Employed Business' | 'Agriculture';
    employerOrBusinessName: string;
    vintageYears: number;
  };
  loanDetails: {
    product: LoanProduct;
    requestedAmount: number;
    tenureMonths: number;
    interestRate: number; // % p.a.
    purpose: string;
    repaymentFrequency: 'Monthly' | 'Quarterly';
    estimatedEMI: number;
  };
  financialDetails: {
    monthlyIncome: number;
    existingMonthlyObligations: number;
    estimatedMonthlyExpenses: number;
    netMonthlySurplus: number;
  };
  documents: LoanDocument[];
  assessment?: CreditAssessment;
  approval?: ApprovalDecision;
  disbursement?: DisbursementDetails;
  branch: string;
  assignedOfficer: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditEvent[];
  isOfflineDraft?: boolean;
}

export interface Customer {
  id: string; // e.g. CUST-2026-1001
  fullName: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  branch: string;
  employmentType: string;
  employer: string;
  panMasked: string; // e.g. ABCDE****F
  aadhaarMasked: string; // e.g. ****-****-1234
  createdAt: string;
  totalApplications: number;
  activeLoansCount: number;
  totalBorrowedAmount: number;
  cibilScore: number;
  tags: string[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'alert';
  applicationId?: string;
  actionUrl?: string;
}

export interface BranchPerformance {
  branchName: string;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  totalSanctionedAmount: number;
  avgTurnaroundDays: number;
}
