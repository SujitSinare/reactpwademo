import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Briefcase,
  CreditCard,
} from 'lucide-react';
import { storage } from '../../lib/storage';
import { Customer } from '../../types';
import { formatCurrencyINR, formatDateIndian } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { MOCK_BRANCHES } from '../../mocks/seedData';

export const CustomerDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const applications = storage.getApplications();

  // Selected customer for modal inspect
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedEmployment, setSelectedEmployment] = useState('All');

  useEffect(() => {
    return storage.subscribe(() => {
      setCustomers(storage.getCustomers());
    });
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.city.toLowerCase().includes(q);

      const matchBranch = selectedBranch === 'All' || c.branch === selectedBranch;
      const matchEmp = selectedEmployment === 'All' || c.employmentType === selectedEmployment;

      return matchQuery && matchBranch && matchEmp;
    });
  }, [customers, searchQuery, selectedBranch, selectedEmployment]);

  // Find linked applications for a customer
  const getCustomerApplications = (customerId: string) => {
    return applications.filter((a) => a.customerId === customerId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Customer Directory & Dossiers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synthetic banking customer profiles, active credit facilities, and cross-borrower history
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer name, ID, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
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

          <div>
            <select
              value={selectedEmployment}
              onChange={(e) => setSelectedEmployment(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="All">All Employment Types</option>
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed Business">Self-Employed Business</option>
              <option value="Self-Employed Professional">Self-Employed Professional</option>
              <option value="Agriculture">Agriculture</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const linkedApps = getCustomerApplications(cust.id);
          return (
            <Card
              key={cust.id}
              hoverEffect
              className="cursor-pointer"
              onClick={() => setSelectedCustomer(cust)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 font-bold flex items-center justify-center text-sm border border-teal-200 dark:border-teal-800">
                      {cust.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{cust.fullName}</h4>
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{cust.id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    CIBIL: {cust.cibilScore}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cust.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {cust.employmentType} — {cust.employer}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {cust.city}, {cust.branch.split(' - ')[0]}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Linked Applications:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {linkedApps.length} file{linkedApps.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer File: ${selectedCustomer.fullName}`}
          description={`Reference ID: ${selectedCustomer.id} • Registered ${formatDateIndian(selectedCustomer.createdAt)}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Demographic & Masked Identifiers */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Mobile</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCustomer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Simulated PAN</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCustomer.panMasked}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Simulated Aadhaar</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCustomer.aadhaarMasked}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Credit Bureau Score</span>
                <span className="font-bold text-emerald-600">{selectedCustomer.cibilScore} / 900</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Home Branch</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCustomer.branch}</span>
              </div>
            </div>

            {/* Linked Applications List */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Linked Loan Applications
              </h4>
              <div className="space-y-2">
                {getCustomerApplications(selectedCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-500">No loan files linked to this customer reference yet.</p>
                ) : (
                  getCustomerApplications(selectedCustomer.id).map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        navigate(`/applications/${app.id}`);
                        setSelectedCustomer(null);
                      }}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 flex items-center justify-between cursor-pointer transition-colors text-xs"
                    >
                      <div>
                        <span className="font-bold text-teal-600 dark:text-teal-400 mr-2">{app.id}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{app.loanDetails.product}</span>
                        <span className="text-slate-400 text-[11px] ml-2">
                          ({formatCurrencyINR(app.loanDetails.requestedAmount)})
                        </span>
                      </div>
                      <Badge variant="outline">{app.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
