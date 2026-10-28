import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../../types';
import { MOCK_USERS } from '../../mocks/seedData';

interface LoginCredentials {
  identifier: string;
  password?: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  quickLoginAsUser: (userId: string) => void;
  logout: () => void;
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
const AUTH_STATUS_KEY = 'unity_los_is_authenticated_v1';

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authFlag = localStorage.getItem(AUTH_STATUS_KEY);
    // If not set before, default to false so user sees the login screen
    return authFlag === 'true';
  });

  useEffect(() => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const login = async ({ identifier, password, rememberMe = true }: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    // Simulate brief network authentication latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanId = identifier.trim().toLowerCase();

    if (!cleanId) {
      return { success: false, error: 'Please enter your Employee Code, Email, or Username.' };
    }

    if (!password || password.trim().length === 0) {
      return { success: false, error: 'Please enter your security password.' };
    }

    // Role or alias matching
    let matchedUser = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.employeeCode.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId
    );

    // Support convenient aliases for testing
    if (!matchedUser) {
      if (cleanId === 'admin' || cleanId === 'administrator') {
        matchedUser = MOCK_USERS.find((u) => u.role === 'System Administrator');
      } else if (cleanId === 'officer' || cleanId === 'branch') {
        matchedUser = MOCK_USERS.find((u) => u.role === 'Branch Officer');
      } else if (cleanId === 'credit' || cleanId === 'analyst') {
        matchedUser = MOCK_USERS.find((u) => u.role === 'Credit Analyst');
      } else if (cleanId === 'manager' || cleanId === 'approver') {
        matchedUser = MOCK_USERS.find((u) => u.role === 'Credit Manager');
      } else if (cleanId === 'operations' || cleanId === 'disburse') {
        matchedUser = MOCK_USERS.find((u) => u.role === 'Operations Manager');
      } else if (cleanId === 'unity' || cleanId === 'demo' || cleanId === 'user') {
        matchedUser = MOCK_USERS[0];
      }
    }

    // Static fallback: if user typed something reasonable, default to Branch Officer or matchedUser
    const targetUser = matchedUser || MOCK_USERS[0];

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    if (rememberMe) {
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
    } else {
      sessionStorage.setItem(AUTH_STATUS_KEY, 'true');
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
    }

    return { success: true };
  };

  const quickLoginAsUser = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STATUS_KEY, 'true');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STATUS_KEY);
    sessionStorage.removeItem(AUTH_STATUS_KEY);
  };

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
    isAuthenticated,
    login,
    quickLoginAsUser,
    logout,
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
