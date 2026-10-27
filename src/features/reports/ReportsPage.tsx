import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Building2,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  IndianRupee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { storage } from '../../lib/storage';
import { LoanApplication } from '../../types';
import { formatCurrencyINR, exportToCSV } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MOCK_BRANCHES } from '../../mocks/seedData';
import { usePwa } from '../pwa/PwaContext';

export const ReportsPage: React.FC = () => {
  const { showToast } = usePwa();
  const [applications, setApplications] = useState<LoanApplication[]>(() => storage.getApplications());
  const [selectedBranch, setSelectedBranch] = useState('All');

  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      return selectedBranch === 'All' || app.branch === selectedBranch;
    });
  }, [applications, selectedBranch]);

  // Derived Metrics
  const totalCount = filteredApps.length;
  const approvedCount = filteredApps.filter((a) =>
    ['Approved', 'Ready for Disbursement', 'Disbursed'].includes(a.status)
  ).length;
  const rejectedCount = filteredApps.filter((a) => a.status === 'Rejected').length;
  const approvalRate = totalCount > 0 ? Math.round((approvedCount / (approvedCount + rejectedCount || 1)) * 100) : 0;

  const totalRequested = filteredApps.reduce((acc, c) => acc + c.loanDetails.requestedAmount, 0);
  const totalSanctioned = filteredApps.reduce((acc, c) => {
    if (['Approved', 'Ready for Disbursement', 'Disbursed'].includes(c.status)) {
      return acc + (c.approval?.approvedAmount || c.loanDetails.requestedAmount);
    }
    return acc;
  }, 0);

  // Branch Performance Table
  const branchPerformance = useMemo(() => {
    const map: Record<string, { total: number; approved: number; rejected: number; volume: number }> = {};
    filteredApps.forEach((a) => {
      if (!map[a.branch]) {
        map[a.branch] = { total: 0, approved: 0, rejected: 0, volume: 0 };
      }
      map[a.branch].total += 1;
      if (['Approved', 'Ready for Disbursement', 'Disbursed'].includes(a.status)) {
        map[a.branch].approved += 1;
        map[a.branch].volume += a.approval?.approvedAmount || a.loanDetails.requestedAmount;
      } else if (a.status === 'Rejected') {
        map[a.branch].rejected += 1;
      }
    });

    return Object.entries(map).map(([branchName, stats]) => ({
      branchName,
      total: stats.total,
      approved: stats.approved,
      rejected: stats.rejected,
      rate: stats.total > 0 ? Math.round((stats.approved / (stats.approved + stats.rejected || 1)) * 100) : 0,
      sanctionVolume: stats.volume,
    }));
  }, [filteredApps]);

  // Product Volume Comparison
  const productChartData = useMemo(() => {
    const map: Record<string, { requested: number; sanctioned: number }> = {};
    filteredApps.forEach((a) => {
      const p = a.loanDetails.product;
      if (!map[p]) map[p] = { requested: 0, sanctioned: 0 };
      map[p].requested += Math.round(a.loanDetails.requestedAmount / 100000);
      if (['Approved', 'Ready for Disbursement', 'Disbursed'].includes(a.status)) {
        map[p].sanctioned += Math.round(
          (a.approval?.approvedAmount || a.loanDetails.requestedAmount) / 100000
        );
      }
    });

    return Object.entries(map).map(([product, val]) => ({
      product,
      'Requested (₹ Lakhs)': val.requested,
      'Sanctioned (₹ Lakhs)': val.sanctioned,
    }));
  }, [filteredApps]);

  const handleExportReportCSV = () => {
    const rows = branchPerformance.map((b) => ({
      Branch: b.branchName,
      'Total Applications': b.total,
      'Approved Sanctions': b.approved,
      'Rejected Files': b.rejected,
      'Approval Rate (%)': `${b.rate}%`,
      'Sanction Volume (INR)': b.sanctionVolume,
    }));
    exportToCSV(`Unity_LOS_Branch_Performance_Report`, rows);
    showToast('Report Exported', 'Branch performance summary exported to CSV.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Credit Analytics & Portfolio Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Origination velocity, branch performance metrics, approval turnaround, and portfolio sanction ratios
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200"
          >
            <option value="All">All Branches</option>
            {MOCK_BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={handleExportReportCSV} className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-xs text-slate-400 block">Total Applied Demand</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 block">
            {formatCurrencyINR(totalRequested)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{totalCount} files</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-slate-400 block">Sanctioned Volume</span>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1 block">
            {formatCurrencyINR(totalSanctioned)}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">{approvedCount} approvals</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-slate-400 block">Decision Approval Rate</span>
          <span className="text-lg font-bold text-emerald-600 mt-1 block">{approvalRate}%</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Approved vs Rejected</span>
        </Card>

        <Card className="p-4">
          <span className="text-xs text-slate-400 block">Average Processing TAT</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 block">3.4 Days</span>
          <span className="text-[10px] text-teal-600 mt-0.5 block">Underwriter SLA: 5 Days</span>
        </Card>
      </div>

      {/* Product Requested vs Sanctioned Chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-sm">Requested Demand vs Sanctioned Volume (₹ Lakhs)</CardTitle>
            <p className="text-xs text-slate-400">Comparison across loan products</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="product" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '0.75rem',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Requested (₹ Lakhs)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Sanctioned (₹ Lakhs)" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Branch Performance Summary Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-sm">Branch Performance League Table</CardTitle>
            <p className="text-xs text-slate-400">Origination volume, approval rates, and sanctions by branch</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Branch Location</th>
                  <th className="py-3 px-4">Total Files</th>
                  <th className="py-3 px-4">Approved</th>
                  <th className="py-3 px-4">Rejected</th>
                  <th className="py-3 px-4">Approval Rate</th>
                  <th className="py-3 px-4 text-right">Sanctioned Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {branchPerformance.map((b) => (
                  <tr key={b.branchName} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {b.branchName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{b.total}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">{b.approved}</td>
                    <td className="py-3 px-4 text-rose-500 font-semibold">{b.rejected}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${b.rate}%` }}
                          />
                        </div>
                        <span className="font-medium text-[11px]">{b.rate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrencyINR(b.sanctionVolume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
