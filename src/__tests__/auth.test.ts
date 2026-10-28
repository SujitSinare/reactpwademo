import { describe, it, expect } from 'vitest';
import { MOCK_USERS } from '../mocks/seedData';

describe('Authentication & User Matching Logic', () => {
  it('contains valid mock users for all core banking roles', () => {
    expect(MOCK_USERS.length).toBeGreaterThanOrEqual(5);

    const roles = MOCK_USERS.map((u) => u.role);
    expect(roles).toContain('Branch Officer');
    expect(roles).toContain('Credit Analyst');
    expect(roles).toContain('Credit Manager');
    expect(roles).toContain('Operations Manager');
    expect(roles).toContain('System Administrator');
  });

  it('matches branch officer by email or employee code', () => {
    const officer = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === 'rajesh.sharma@unitybank.demo.in' ||
        u.employeeCode.toLowerCase() === 'ub-bo-4102'
    );
    expect(officer).toBeDefined();
    expect(officer?.name).toBe('Rajesh Sharma');
    expect(officer?.role).toBe('Branch Officer');
  });

  it('matches system administrator by employee code', () => {
    const admin = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === 'vikram.joshi@unitybank.demo.in' ||
        u.employeeCode.toLowerCase() === 'ub-sa-0012'
    );
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('System Administrator');
  });
});
