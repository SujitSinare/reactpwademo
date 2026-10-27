import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  ArrowUpDown,
  Building2,
  Calendar,
  Eye,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { LoanApplication, LoanProduct, ApplicationStatus } from '../../types';
import { formatCurrencyINR, formatDateIndian, formatDateTimeIndian, getStatusBadgeClass, exportToCSV } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MOCK_BRANCHES, MOCK_USERS } from '../../mocks/seedData';
import { useAuth } from '../auth/AuthContext';
import { usePwa } from '../pwa/PwaContext';

export const ApplicationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, canCreateApplication } = useAuth();
  const { showToast } = usePwa();

  const [applications, setApplications] = useState<LoanApplication[]>(() => storage.getApplications());

  // Listen to storage changes
  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [sortField, setSortField] = useState<'createdAt' | 'requestedAmount' | 'id'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination & Layout view toggle
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtered & Sorted applications
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          app.id.toLowerCase().includes(query) ||
          app.applicant.fullName.toLowerCase().includes(query) ||
          app.applicant.mobile.includes(query) ||
          app.applicant.email.toLowerCase().includes(query);

        const matchesProduct = selectedProduct === 'All' || app.loanDetails.product === selectedProduct;
        const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;
        const matchesBranch = selectedBranch === 'All' || app.branch === selectedBranch;

        return matchesQuery && matchesProduct && matchesStatus && matchesBranch;
      })
      .sort((a, b) => {
        let valA: any = sortField === 'requestedAmount' ? a.loanDetails.requestedAmount : (a as any)[sortField];
        let valB: any = sortField === 'requestedAmount' ? b.loanDetails.requestedAmount : (b as any)[sortField];

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [applications, searchQuery, selectedProduct, selectedStatus, selectedBranch, sortField, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage) || 1;
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApps.slice(start, start + itemsPerPage);
  }, [filteredApps, currentPage]);

  const handleSort = (field: 'createdAt' | 'requestedAmount' | 'id') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const rows = filteredApps.map((a) => ({
      'Application ID': a.id,
      'Applicant Name': a.applicant.fullName,
      Mobile: a.applicant.mobile,
      Email: a.applicant.email,
      'Loan Product': a.loanDetails.product,
      'Requested Amount (INR)': a.loanDetails.requestedAmount,
      'Tenure (Months)': a.loanDetails.tenureMonths,
      'Interest Rate (%)': a.loanDetails.interestRate,
      Branch: a.branch,
      'Assigned Officer': a.assignedOfficer,
      Status: a.status,
      'Application Date': a.createdAt,
      'Last Updated': a.updatedAt,
    }));
    exportToCSV(`Unity_LOS_Applications_${new Date().toISOString().split('T')[0]}`, rows);
    showToast('Export Successful', `Exported ${rows.length} applications to CSV.`, 'success');
  };

  const allStatuses: ApplicationStatus[] = [
    'Draft',
    'Submitted',
    'Document Verification',
    'Credit Assessment',
    'Pending Approval',
    'Approved',
    'Ready for Disbursement',
    'Disbursed',
    'Rejected',
    'On Hold',
    'Incomplete',
    'Cancelled',
  ];

  const allProducts: LoanProduct[] = [
    'Personal Loan',
    'Business Loan',
    'Loan Against Property',
    'Gold Loan',
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Loan Applications Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage originations, search files, inspect applicant dossiers, and review statuses ({applications.length} files)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 flex-1 sm:flex-initial"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/applications/new')}
            className="text-xs gap-1.5 flex-1 sm:flex-initial shadow-md shadow-teal-600/20"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Application</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ID, name, mobile..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Product Filter */}
            <div>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="All">All Loan Products</option>
                {allProducts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="All">All Statuses ({applications.length})</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1.5 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="All">All Branches</option>
                {MOCK_BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters & View Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 text-[11px]">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredApps.length}</span> matching applications
            </span>

            <div className="flex items-center gap-2">
              {/* Reset Filters */}
              {(searchQuery || selectedProduct !== 'All' || selectedStatus !== 'All' || selectedBranch !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedProduct('All');
                    setSelectedStatus('All');
                    setSelectedBranch('All');
                    setCurrentPage(1);
                  }}
                  className="text-teal-600 dark:text-teal-400 text-[11px] hover:underline"
                >
                  Clear all filters
                </button>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-400'}`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1 rounded ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-400'}`}
                  title="Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Listing View (Table or Cards) */}
      {filteredApps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any loan application matching your current search or filter combination.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedProduct('All');
                setSelectedStatus('All');
                setSelectedBranch('All');
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold select-none">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Application ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Loan Product</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                    onClick={() => handleSort('requestedAmount')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Requested Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Officer</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Applied Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedApps.map((app) => {
                  const badge = getStatusBadgeClass(app.status);
                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <td className="py-3 px-4 font-semibold text-teal-600 dark:text-teal-400">{app.id}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{app.applicant.fullName}</p>
                        <p className="text-[10px] text-slate-400">{app.applicant.mobile}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {app.loanDetails.product}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyINR(app.loanDetails.requestedAmount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[130px]">{app.branch}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px]">
                        {app.assignedOfficer}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDateIndian(app.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-teal-600 hover:text-teal-700 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/applications/${app.id}`);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Card Layout for Mobile / Tablet / User Preference */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedApps.map((app) => {
            const badge = getStatusBadgeClass(app.status);
            return (
              <Card
                key={app.id}
                hoverEffect
                className="cursor-pointer"
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-teal-600 dark:text-teal-400">{app.id}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {app.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{app.applicant.fullName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{app.loanDetails.product}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Requested Amount</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyINR(app.loanDetails.requestedAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tenure / EMI</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {app.loanDetails.tenureMonths}m ({formatCurrencyINR(app.loanDetails.estimatedEMI)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{app.branch.split(' - ')[0]}</span>
                    <span>{formatDateIndian(app.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs">
          <span className="text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 font-semibold text-slate-700 dark:text-slate-300">{currentPage}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
