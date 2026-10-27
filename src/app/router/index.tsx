import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../../components/common/AppLayout';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { ApplicationsListPage } from '../../features/applications/ApplicationsListPage';
import { NewApplicationPage } from '../../features/applications/NewApplicationPage';
import { ApplicationDetailPage } from '../../features/applications/ApplicationDetailPage';
import { CustomerDirectoryPage } from '../../features/customers/CustomerDirectoryPage';
import { DocumentVerificationPage } from '../../features/documents/DocumentVerificationPage';
import { CreditAssessmentPage } from '../../features/credit-assessment/CreditAssessmentPage';
import { ApprovalQueuePage } from '../../features/approvals/ApprovalQueuePage';
import { DisbursementPage } from '../../features/disbursement/DisbursementPage';
import { ReportsPage } from '../../features/reports/ReportsPage';
import { NotificationsPage } from '../../features/notifications/NotificationsPage';
import { PwaOfflinePage } from '../../features/pwa/PwaOfflinePage';
import { SettingsPage } from '../../features/settings/SettingsPage';
import { RouteErrorBoundary } from '../../components/common/RouteErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'applications',
        element: <ApplicationsListPage />,
      },
      {
        path: 'applications/new',
        element: <NewApplicationPage />,
      },
      {
        path: 'applications/:id',
        element: <ApplicationDetailPage />,
      },
      {
        path: 'customers',
        element: <CustomerDirectoryPage />,
      },
      {
        path: 'verification',
        element: <DocumentVerificationPage />,
      },
      {
        path: 'credit-assessment',
        element: <CreditAssessmentPage />,
      },
      {
        path: 'approvals',
        element: <ApprovalQueuePage />,
      },
      {
        path: 'disbursement',
        element: <DisbursementPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'pwa-offline',
        element: <PwaOfflinePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
