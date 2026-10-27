import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApplicationStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to Indian Currency notation (₹ Lakhs & Crores)
 * e.g., 1500000 -> "₹ 15,00,000"
 */
export function formatCurrencyINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹ 0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string to Indian date format (DD MMM YYYY)
 */
export function formatDateIndian(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats an ISO date string with time (DD MMM YYYY, hh:mm a)
 */
export function formatDateTimeIndian(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calculates standard Equated Monthly Installment (EMI)
 * Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
 * @param principal Principal loan amount
 * @param annualRate Annual interest rate in percentage (e.g. 10.5 for 10.5%)
 * @param tenureMonths Tenure in months
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (!principal || !tenureMonths || tenureMonths <= 0) return 0;
  if (!annualRate || annualRate <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = annualRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Calculates Fixed Obligation to Income Ratio (FOIR / DTI)
 * Formula: ((Existing Obligations + Proposed EMI) / Monthly Income) * 100
 */
export function calculateFOIR(monthlyIncome: number, existingObligations: number, proposedEMI: number): number {
  if (!monthlyIncome || monthlyIncome <= 0) return 0;
  const totalObligations = existingObligations + proposedEMI;
  const foir = (totalObligations / monthlyIncome) * 100;
  return Math.round(foir * 10) / 10;
}

/**
 * Returns Tailwind badge classes for loan statuses
 */
export function getStatusBadgeClass(status: ApplicationStatus): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'Draft':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'Submitted':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    case 'Document Verification':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'Credit Assessment':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
      };
    case 'Pending Approval':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/50',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800',
        dot: 'bg-cyan-500',
      };
    case 'Approved':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'Ready for Disbursement':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/50',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800',
        dot: 'bg-teal-500',
      };
    case 'Disbursed':
      return {
        bg: 'bg-green-100 dark:bg-green-950/60',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-300 dark:border-green-800',
        dot: 'bg-green-600',
      };
    case 'Rejected':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
      };
    case 'On Hold':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/50',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
      };
    case 'Incomplete':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/50',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
        dot: 'bg-yellow-500',
      };
    case 'Cancelled':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-400',
      };
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

/**
 * Helper to export any array of records to a downloadable CSV file
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(fieldName => {
          let val = row[fieldName];
          if (val === null || val === undefined) val = '';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
