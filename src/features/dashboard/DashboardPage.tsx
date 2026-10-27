import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Calendar,
  FileCheck2,
  Calculator,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  TrendingUp,
  PlusCircle,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Bell,
  Building2,
  ExternalLink,
  ChevronRight,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { storage } from '../../lib/storage';
import { formatCurrencyINR, formatDateIndian, formatDateTimeIndian, getStatusBadgeClass } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MOCK_BRANCHES } from '../../mocks/seedData';
import { useAuth } from '../../features/auth/AuthContext';
import { usePwa } from '../../features/pwa/PwaContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { sendTestPushNotification } = usePwa();

  const [applications, setApplications] = useState(() => storage.getApplications());
  const [selectedBranch, setSelectedBranch] = useState<string>('All Branches');
  const [dateRange, setDateRange] = useState<string>('All Time');

  // Listen to storage changes
  useEffect(() => {
    return storage.subscribe(() => {
      setApplications(storage.getApplications());
    });
  }, []);

  // Filtered dataset based on branch & date
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (selectedBranch !== 'All Branches' && app.branch !== selectedBranch) {
        return false;
      }
      if (dateRange === 'Today') {
        const appDate = new Date(app.createdAt).toISOString().split('T')[0];
        const todayStr = '2026-10-27'; // Consistent demo today
        return appDate === todayStr;
      }
      if (dateRange === 'Last 7 Days') {
        const appDate = new Date(app.createdAt);
        const cutoff = new Date('2026-10-20T00:00:00Z');
        return appDate >= cutoff;
      }
      if (dateRange === 'This Month') {
        return app.createdAt.startsWith('2026-10');
      }
      return true;
    });
  }, [applications, selectedBranch, dateRange]);

  // Derived KPI Metrics
  const totalApps = filteredApps.length;
  const appsToday = filteredApps.filter((a) => a.createdAt.startsWith('2026-10-27')).length;
  const pendingDocs = filteredApps.filter(
    (a) => a.status === 'Document Verification' || a.status === 'Submitted'
  ).length;
  const pendingAssessment = filteredApps.filter((a) => a.status === 'Credit Assessment').length;
  const pendingApprovals = filteredApps.filter((a) => a.status === 'Pending Approval').length;
  const approvedLoans = filteredApps.filter(
    (a) => a.status === 'Approved' || a.status === 'Ready for Disbursement' || a.status === 'Disbursed'
  ).length;
  const rejectedApps = filteredApps.filter((a) => a.status === 'Rejected').length;
  const readyForDisbursement = filteredApps.filter((a) => a.status === 'Ready for Disbursement').length;
  const totalDisbursed = filteredApps.filter((a) => a.status === 'Disbursed').length;

  const totalRequestedAmount = filteredApps.reduce((acc, curr) => acc + curr.loanDetails.requestedAmount, 0);
  const totalApprovedAmount = filteredApps.reduce((acc, curr) => {
    if (curr.approval?.approvedAmount) return acc + curr.approval.approvedAmount;
    if (['Approved', 'Ready for Disbursement', 'Disbursed'].includes(curr.status)) {
      return acc + curr.loanDetails.requestedAmount;
    }
    return acc;
  }, 0);

  const avgTatDays = 3.4; // Average processing time (TAT)

  // Portfolio by Product
  const productDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {};
    filteredApps.forEach((app) => {
      const prod = app.loanDetails.product;
      if (!map[prod]) map[prod] = { count: 0, totalAmount: 0 };
      map[prod].count += 1;
      map[prod].totalAmount += app.loanDetails.requestedAmount;
    });
    return Object.entries(map).map(([name, val]) => ({
      name,
      count: val.count,
      amount: val.totalAmount,
    }));
  }, [filteredApps]);

  const COLORS = ['#0D9488', '#0284C7', '#8B5CF6', '#F59E0B'];

  // Status Distribution
  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredApps.forEach((app) => {
      map[app.status] = (map[app.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({
      status,
      count,
    }));
  }, [filteredApps]);

  // Branch-wise Distribution
  const branchDistribution = useMemo(() => {
    const map: Record<string, { count: number; volume: number }> = {};
    filteredApps.forEach((app) => {
      const branch = app.branch.split(' - ')[0]; // short name
      if (!map[branch]) map[branch] = { count: 0, volume: 0 };
      map[branch].count += 1;
      map[branch].volume += app.loanDetails.requestedAmount;
    });
    return Object.entries(map).map(([branch, val]) => ({
      branch,
      count: val.count,
      volume: Math.round(val.volume / 100000), // in Lakhs
    }));
  }, [filteredApps]);

  // 6-Month Application Trend (realistic simulated timeline leading to Oct 2026)
  const trendData = [
    { month: 'May 26', applications: 18, sanctionedAmountLakhs: 210 },
    { month: 'Jun 26', applications: 24, sanctionedAmountLakhs: 295 },
    { month: 'Jul 26', applications: 29, sanctionedAmountLakhs: 380 },
    { month: 'Aug 26', applications: 35, sanctionedAmountLakhs: 460 },
    { month: 'Sep 26', applications: 42, sanctionedAmountLakhs: 580 },
    { month: 'Oct 26 (Current)', applications: filteredApps.length + 22, sanctionedAmountLakhs: Math.round(totalApprovedAmount / 100000) + 340 },
  ];

  // Recent 5 Applications
  const recentApplications = filteredApps.slice(0, 5);

  // Recent Audit Events
  const recentActivities = useMemo(() => {
    const allEvents: { event: any; appId: string; applicantName: string }[] = [];
    filteredApps.forEach((app) => {
      app.auditTrail.forEach((event) => {
        allEvents.push({ event, appId: app.id, applicantName: app.applicant.fullName });
      });
    });
    return allEvents
      .sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime())
      .slice(0, 5);
  }, [filteredApps]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-unity-navy-900 via-unity-navy-800 to-unity-navy-700 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Credit Ops Dashboard
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-300">Welcome, {currentUser.name} ({currentUser.role})</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">
            Unity Small Finance Bank — Loan Origination System
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time pipeline monitoring, automated debt-to-income underwriting, risk scoring, document verification, and sanction disbursement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/applications/new')}
            className="shadow-lg shadow-teal-600/30 gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Loan Application</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => sendTestPushNotification()}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-2 text-xs"
          >
            <Bell className="w-4 h-4 text-teal-400" />
            <span>Trigger Demo Push</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Filter Pipeline:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Branch Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-auto"
            >
              <option value="All Branches">All Branches ({applications.length})</option>
              {MOCK_BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-auto"
            >
              <option value="All Time">All Time</option>
              <option value="Today">Today (27 Oct 2026)</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month (Oct 2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 10 Enterprise KPI Cards (All dynamically derived from mock dataset) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1. Total Applications */}
        <Card hoverEffect className="cursor-pointer" onClick={() => navigate('/applications')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Total Applications</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalApps}</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+18% MoM growth</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Received Today */}
        <Card hoverEffect>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Received Today</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{appsToday}</p>
            <p className="text-[11px] text-slate-400 mt-1">27 Oct 2026 logged</p>
          </CardContent>
        </Card>

        {/* 3. Pending Doc Verification */}
        <Card hoverEffect className="cursor-pointer" onClick={() => navigate('/verification')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Doc Verification</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{pendingDocs}</p>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting scrutiny</p>
          </CardContent>
        </Card>

        {/* 4. Pending Credit Assessment */}
        <Card hoverEffect className="cursor-pointer" onClick={() => navigate('/credit-assessment')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Credit Appraisal</span>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
                <Calculator className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{pendingAssessment}</p>
            <p className="text-[11px] text-slate-400 mt-1">Underwriter queue</p>
          </CardContent>
        </Card>

        {/* 5. Pending Approvals */}
        <Card hoverEffect className="cursor-pointer" onClick={() => navigate('/approvals')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Pending Approval</span>
              <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{pendingApprovals}</p>
            <p className="text-[11px] text-slate-400 mt-1">Manager sanction queue</p>
          </CardContent>
        </Card>

        {/* 6. Approved Loans */}
        <Card hoverEffect>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Approved Loans</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{approvedLoans}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sanctioned {formatCurrencyINR(totalApprovedAmount)}
            </p>
          </CardContent>
        </Card>

        {/* 7. Rejected Applications */}
        <Card hoverEffect>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Rejected</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">{rejectedApps}</p>
            <p className="text-[11px] text-slate-400 mt-1">Adverse credit score/FOIR</p>
          </CardContent>
        </Card>

        {/* 8. Ready for Disbursement */}
        <Card hoverEffect className="cursor-pointer" onClick={() => navigate('/disbursement')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Disb. Pipeline</span>
              <div className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-lg">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">{readyForDisbursement}</p>
            <p className="text-[11px] text-slate-400 mt-1">{totalDisbursed} loans disbursed</p>
          </CardContent>
        </Card>

        {/* 9. Total Requested Amount */}
        <Card hoverEffect>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Pipeline Value</span>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 rounded-lg">
                <span className="font-bold text-xs">₹</span>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-2 truncate">
              {formatCurrencyINR(totalRequestedAmount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Cumulative applied</p>
          </CardContent>
        </Card>

        {/* 10. Average TAT */}
        <Card hoverEffect>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Average TAT</span>
              <div className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{avgTatDays} Days</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">-1.2 days vs SLA</p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Application Volume & Sanctions Trend</CardTitle>
              <p className="text-xs text-slate-400">Monthly loan intake and approved loan amounts</p>
            </div>
            <Badge variant="primary" dot>
              Live Originating Flow
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stop-color="#0D9488" stopOpacity={0.4} />
                      <stop offset="95%" stop-color="#0D9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAmt" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stop-color="#0284C7" stopOpacity={0.3} />
                      <stop offset="95%" stop-color="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
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
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Applications Count"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorApps)"
                  />
                  <Area
                    type="monotone"
                    dataKey="sanctionedAmountLakhs"
                    name="Sanctioned (₹ Lakhs)"
                    stroke="#0284C7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmt)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio by Product (Donut) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Loan Portfolio Mix</CardTitle>
              <p className="text-xs text-slate-400">Distribution by loan product type</p>
            </div>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productDistribution}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {productDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `${value} applications (${formatCurrencyINR(item.payload.amount)})`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '0.75rem',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="w-full grid grid-cols-2 gap-2 mt-2">
              {productDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="font-semibold ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Branch Volume & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch-wise Volume */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Branch-wise Volume (₹ Lakhs)</CardTitle>
              <p className="text-xs text-slate-400">Loan demand across regional clusters</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="branch" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹ ${val} Lakhs`, 'Sanction Demand']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '0.75rem',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="volume" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Application Status Pipeline */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lifecycle Stage Distribution</CardTitle>
              <p className="text-xs text-slate-400">Applications currently in each underwriting stage</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={statusDistribution}
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="status" type="category" stroke="#94A3B8" fontSize={10} tickLine={false} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '0.75rem',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#0284C7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Recent Applications & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent Loan Applications</CardTitle>
              <p className="text-xs text-slate-400">Newly lodged and recently updated files</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/applications')} className="text-xs gap-1">
              <span>View All Applications</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Application ID</th>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentApplications.map((app) => {
                    const badge = getStatusBadgeClass(app.status);
                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        <td className="py-3 px-4 font-semibold text-teal-600 dark:text-teal-400">{app.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{app.applicant.fullName}</p>
                          <p className="text-[10px] text-slate-400">{app.applicant.mobile}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{app.loanDetails.product}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrencyINR(app.loanDetails.requestedAmount)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[120px]">{app.branch}</td>
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
                            className="p-1 h-7 text-teal-600 hover:text-teal-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/${app.id}`);
                            }}
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Required & Recent Activity */}
        <div className="space-y-6">
          {/* Action Required Panel */}
          <Card>
            <CardHeader className="py-3.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-sm">Action Required Queue</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              <div
                onClick={() => navigate('/verification')}
                className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Verify Pending Documents
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {pendingDocs} files awaiting physical / digital checks
                  </p>
                </div>
                <Badge variant="warning">{pendingDocs}</Badge>
              </div>

              <div
                onClick={() => navigate('/approvals')}
                className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-between cursor-pointer hover:bg-cyan-100/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-cyan-900 dark:text-cyan-200">Sanction Decisions</p>
                  <p className="text-[11px] text-cyan-700 dark:text-cyan-400">
                    {pendingApprovals} files waiting for Credit Manager
                  </p>
                </div>
                <Badge variant="cyan">{pendingApprovals}</Badge>
              </div>

              <div
                onClick={() => navigate('/disbursement')}
                className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Execute Disbursal</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {readyForDisbursement} loans ready for fund release
                  </p>
                </div>
                <Badge variant="success">{readyForDisbursement}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="py-3.5">
              <CardTitle className="text-sm">Recent Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {recentActivities.map(({ event, appId, applicantName }, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold">{appId}</span> ({applicantName})
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                      {event.action}: {event.details}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{formatDateTimeIndian(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
