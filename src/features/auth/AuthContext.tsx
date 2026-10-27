import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { MOCK_USERS } from '../../mocks/seedData';

interface AuthContextType {
  currentUser: UserProfile;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  allUsers: UserProfile[];
  canCreateApplication: boolean;
  canVerifyDocuments: boolean;
  canPerformCreditAssessment: boolean;
  canApproveApplication: boolean;
  canDisburseLoan: boolean;
  isSystemAdmin: boolean;
}

const CURRENT_USER_KEY = 'unity_los_current_user_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = MOCK_USERS.find((u) => u.id === parsed.id);
        if (match) return match;
      } catch {
        // fallback
      }
    }
    // Default to Branch Officer (Rajesh Sharma)
    return MOCK_USERS[0];
  });

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const switchUser = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) setCurrentUser(found);
  };

  const switchRole = (role: UserRole) => {
    const found = MOCK_USERS.find((u) => u.role === role);
    if (found) setCurrentUser(found);
  };

  const role = currentUser.role;

  const value: AuthContextType = {
    currentUser,
    switchUser,
    switchRole,
    allUsers: MOCK_USERS,
    canCreateApplication: role === 'Branch Officer' || role === 'System Administrator',
    canVerifyDocuments: role === 'Branch Officer' || role === 'Operations Manager' || role === 'System Administrator',
    canPerformCreditAssessment: role === 'Credit Analyst' || role === 'System Administrator',
    canApproveApplication: role === 'Credit Manager' || role === 'System Administrator',
    canDisburseLoan: role === 'Operations Manager' || role === 'System Administrator',
    isSystemAdmin: role === 'System Administrator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
