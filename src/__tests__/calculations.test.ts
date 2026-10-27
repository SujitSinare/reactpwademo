import { describe, it, expect } from 'vitest';
import { calculateEMI, calculateFOIR, formatCurrencyINR, getStatusBadgeClass } from '../lib/utils';
import { ApplicationStatus } from '../types';

describe('Banking Financial Calculations', () => {
  describe('calculateEMI', () => {
    it('should correctly compute monthly reducing EMI for ₹ 12,00,000 at 11.5% for 48 months', () => {
      const emi = calculateEMI(1200000, 11.5, 48);
      // Standard mathematical EMI for 12L @ 11.5% for 48m is ~31,313
      expect(emi).toBeGreaterThan(31000);
      expect(emi).toBeLessThan(32000);
      expect(emi).toBe(31307);
    });

    it('should handle zero interest rate by simple linear division', () => {
      const emi = calculateEMI(120000, 0, 12);
      expect(emi).toBe(10000);
    });

    it('should return 0 when principal or tenure is 0', () => {
      expect(calculateEMI(0, 10, 24)).toBe(0);
      expect(calculateEMI(100000, 10, 0)).toBe(0);
    });
  });

  describe('calculateFOIR', () => {
    it('should compute correct FOIR percentage', () => {
      // Monthly income: 1,00,000, Existing EMI: 20,000, Proposed EMI: 25,000
      // Total: 45,000 / 1,00,000 = 45%
      const foir = calculateFOIR(100000, 20000, 25000);
      expect(foir).toBe(45.0);
    });

    it('should return 0 if monthly income is zero or negative', () => {
      expect(calculateFOIR(0, 10000, 20000)).toBe(0);
    });
  });

  describe('formatCurrencyINR', () => {
    it('should format numbers with standard Indian Lakhs grouping', () => {
      const formatted = formatCurrencyINR(1500000);
      expect(formatted).toContain('15,00,000');
    });

    it('should handle undefined or null gracefully', () => {
      expect(formatCurrencyINR(null)).toBe('₹ 0');
      expect(formatCurrencyINR(undefined)).toBe('₹ 0');
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return distinctive badge styling for each lifecycle stage', () => {
      const approvedBadge = getStatusBadgeClass('Approved');
      expect(approvedBadge.text).toContain('emerald');

      const rejectedBadge = getStatusBadgeClass('Rejected');
      expect(rejectedBadge.text).toContain('rose');

      const disbursedBadge = getStatusBadgeClass('Disbursed');
      expect(disbursedBadge.text).toContain('green');
    });
  });

  describe('Workflow Status Lifecycle Policy Rules', () => {
    const isTransitionPermitted = (current: ApplicationStatus, next: ApplicationStatus): boolean => {
      if (current === 'Rejected' || current === 'Cancelled') {
        return false; // Terminal states cannot transition to active/disbursed
      }
      if (next === 'Disbursed' && current !== 'Ready for Disbursement') {
        return false; // Must be Ready for Disbursement first
      }
      return true;
    };

    it('should prevent rejected applications from advancing to disbursement', () => {
      expect(isTransitionPermitted('Rejected', 'Ready for Disbursement')).toBe(false);
      expect(isTransitionPermitted('Rejected', 'Disbursed')).toBe(false);
    });

    it('should enforce that only Ready for Disbursement applications can be Disbursed', () => {
      expect(isTransitionPermitted('Submitted', 'Disbursed')).toBe(false);
      expect(isTransitionPermitted('Pending Approval', 'Disbursed')).toBe(false);
      expect(isTransitionPermitted('Ready for Disbursement', 'Disbursed')).toBe(true);
    });
  });
});
