import { ApplicationStatus, Customer, LoanApplication, SystemNotification, UserRole } from '../types';
import { INITIAL_APPLICATIONS, INITIAL_CUSTOMERS, INITIAL_NOTIFICATIONS } from '../mocks/seedData';

const APPS_STORAGE_KEY = 'unity_los_applications_v1';
const CUSTOMERS_STORAGE_KEY = 'unity_los_customers_v1';
const NOTIFS_STORAGE_KEY = 'unity_los_notifications_v1';
const PENDING_SYNC_KEY = 'unity_los_pending_sync_v1';
const THEME_KEY = 'unity_los_theme_v1';

export interface PendingSyncAction {
  id: string;
  type: 'STATUS_UPDATE' | 'NEW_APPLICATION' | 'DOCUMENT_VERIFY' | 'CREDIT_ASSESSMENT' | 'APPROVAL' | 'DISBURSEMENT';
  applicationId: string;
  timestamp: string;
  payload: any;
}

class StorageManager {
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.initIfEmpty();
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public initIfEmpty(forceReset: boolean = false) {
    if (forceReset || !localStorage.getItem(APPS_STORAGE_KEY)) {
      localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    }
    if (forceReset || !localStorage.getItem(CUSTOMERS_STORAGE_KEY)) {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
    }
    if (forceReset || !localStorage.getItem(NOTIFS_STORAGE_KEY)) {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (forceReset || !localStorage.getItem(PENDING_SYNC_KEY)) {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([]));
    }
    if (forceReset) {
      this.notify();
    }
  }

  // --- Applications ---
  public getApplications(): LoanApplication[] {
    try {
      const data = localStorage.getItem(APPS_STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  }

  public getApplicationById(id: string): LoanApplication | undefined {
    return this.getApplications().find((app) => app.id.toLowerCase() === id.toLowerCase());
  }

  public saveApplication(application: LoanApplication): void {
    const list = this.getApplications();
    const index = list.findIndex((a) => a.id === application.id);
    if (index >= 0) {
      list[index] = { ...application, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...application, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(list));
    this.notify();
  }

  public updateApplicationStatus(
    id: string,
    newStatus: ApplicationStatus,
    performedBy: string,
    role: UserRole,
    details: string
  ): LoanApplication | null {
    const app = this.getApplicationById(id);
    if (!app) return null;

    const prevStatus = app.status;
    app.status = newStatus;
    app.updatedAt = new Date().toISOString();
    app.auditTrail.unshift({
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      performedBy,
      role,
      action: `Status Changed to ${newStatus}`,
      details,
      previousStatus: prevStatus,
      newStatus,
    });

    this.saveApplication(app);

    // Create system notification
    this.addNotification({
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      title: `Status: ${app.id} → ${newStatus}`,
      message: `${app.applicant.fullName}'s application has moved to ${newStatus}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: newStatus === 'Approved' || newStatus === 'Disbursed' ? 'success' : newStatus === 'Rejected' ? 'alert' : 'info',
      applicationId: app.id,
      actionUrl: `/applications/${app.id}`,
    });

    return app;
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  public saveCustomer(customer: Customer): void {
    const list = this.getCustomers();
    const idx = list.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.unshift(customer);
    }
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(list));
    this.notify();
  }

  // --- Notifications ---
  public getNotifications(): SystemNotification[] {
    try {
      const data = localStorage.getItem(NOTIFS_STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  public addNotification(notif: SystemNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(list));
    this.notify();
  }

  public markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(list));
      this.notify();
    }
  }

  public markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(list));
    this.notify();
  }

  // --- Offline Sync Queue ---
  public getPendingSyncActions(): PendingSyncAction[] {
    try {
      const data = localStorage.getItem(PENDING_SYNC_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addPendingSyncAction(action: Omit<PendingSyncAction, 'id' | 'timestamp'>): void {
    const list = this.getPendingSyncActions();
    list.push({
      ...action,
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(list));
    this.notify();
  }

  public clearPendingSyncActions(): void {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify([]));
    this.notify();
  }

  // --- Theme ---
  public getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  }

  public setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.notify();
  }
}

export const storage = new StorageManager();
