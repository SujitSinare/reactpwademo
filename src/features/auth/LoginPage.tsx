import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { UnityLogo } from '../../components/common/UnityLogo';
import { Button } from '../../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickLoginAsUser, allUsers } = useAuth();

  // Form state pre-populated with standard static demo credentials
  const [identifier, setIdentifier] = useState('rajesh.sharma@unitybank.demo.in');
  const [password, setPassword] = useState('Unity@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standard' | 'quick'>('standard');

  const redirectPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await login({
        identifier,
        password,
        rememberMe,
      });

      if (result.success) {
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('A network or server error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (userId: string) => {
    quickLoginAsUser(userId);
    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B0D11] text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Decorative Accent Gradients (Subtle Unity Yellow & Dark Obsidian) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#FCB913]/15 via-[#FCB913]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#FCB913]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-slate-800/40 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar / Bank Banner */}
      <header className="relative z-10 w-full border-b border-slate-800/60 bg-[#0E1217]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FCB913] animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
            Unity LOS • Core Origination Portal
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Secured
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">RBI Regulated Bank</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Main Card Container with Obsidian & Golden Accent Border */}
          <div className="rounded-2xl bg-[#12161F] border border-slate-800/90 shadow-2xl shadow-black/80 overflow-hidden transition-all duration-300">
            {/* Top Brand Banner Strip */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FCB913] via-[#FDB022] to-[#D99B06]" />

            <div className="p-6 sm:p-8">
              {/* Unity Brand Header */}
              <div className="text-center mb-6">
                <div className="inline-flex justify-center p-3 rounded-2xl bg-[#1A1F2B] border border-slate-800 shadow-inner mb-4">
                  <UnityLogo variant="full" theme="dark" size="md" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Loan Origination System
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Enterprise Banker Portal • Internal Access Only
                </p>
              </div>

              {/* Mode Switcher: Standard Credentials vs Quick Demo Personas */}
              <div className="grid grid-cols-2 p-1 bg-[#0B0D11] rounded-xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('standard')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'standard'
                      ? 'bg-[#1E2534] text-[#FCB913] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standard Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'quick'
                      ? 'bg-[#1E2534] text-[#FCB913] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FCB913]" />
                  Demo Roles (1-Click)
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Tab 1: Standard Static Credential Form */}
              {activeTab === 'standard' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Identifier Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Employee Code / Bank Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. rajesh.sharma@unitybank.demo.in"
                        required
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0B0D11] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#FCB913] focus:ring-2 focus:ring-[#FCB913]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Portal Password
                      </label>
                      <span className="text-[11px] text-[#FCB913] hover:underline cursor-pointer">
                        Forgot PIN/Password?
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full pl-10 pr-11 py-2.5 text-sm bg-[#0B0D11] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#FCB913] focus:ring-2 focus:ring-[#FCB913]/20 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Device & Security Note */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#0B0D11] border-slate-700 text-[#FCB913] focus:ring-[#FCB913]/30 accent-[#FCB913]"
                      />
                      <span>Trust this terminal</span>
                    </label>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#FCB913]" /> Fort Branch
                    </span>
                  </div>

                  {/* Primary Submit Button: High-Contrast Yellow on Black Theme */}
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full py-3 bg-[#FCB913] hover:bg-[#E5A106] text-black font-bold text-sm rounded-xl shadow-lg shadow-[#FCB913]/20 hover:shadow-[#FCB913]/30 transition-all transform active:scale-[0.99] border-none mt-2 flex items-center justify-center gap-2"
                  >
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  {/* Default Static Credentials Callout */}
                  <div className="mt-4 p-3 rounded-xl bg-[#0B0D11]/70 border border-slate-800 text-left">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#FCB913] font-semibold mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Static Demo Credentials</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      User: <code className="text-slate-200 bg-slate-800/80 px-1 py-0.5 rounded">rajesh.sharma@unitybank.demo.in</code> (or code <code className="text-slate-200 bg-slate-800/80 px-1 py-0.5 rounded">UB-BO-4102</code>)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Password: <code className="text-slate-200 bg-slate-800/80 px-1 py-0.5 rounded">Unity@2025</code> (any non-empty input is accepted)
                    </p>
                  </div>
                </form>
              )}

              {/* Tab 2: Quick Demo Roles Picker */}
              {activeTab === 'quick' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 mb-3">
                    Select a banking persona below to instantly authenticate and evaluate role-specific capabilities:
                  </p>

                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user.id)}
                      className="w-full text-left p-3 rounded-xl bg-[#0B0D11] border border-slate-800 hover:border-[#FCB913]/50 hover:bg-[#181E2B] transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-[#FCB913]/30"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-white group-hover:text-[#FCB913] transition-colors">
                              {user.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {user.employeeCode}
                            </span>
                          </div>
                          <p className="text-xs text-[#FCB913]/90 font-medium">{user.role}</p>
                          <p className="text-[10px] text-slate-500">{user.branch}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[#FCB913] transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Card Footer: Security Guarantee */}
            <div className="px-6 py-3.5 bg-[#0B0D11]/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#FCB913]" /> PWA Offline Enabled
              </span>
              <span className="text-slate-500">v1.0.0 Demo</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 w-full py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] px-4 text-center border-t border-slate-900 bg-[#07090C] text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-medium">Unity Small Finance Bank Limited</span>
          <span>•</span>
          <span>Internal Loan Origination System</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Security Policy</span>
          <span>•</span>
          <span>IT Helpdesk: 1800-209-4100</span>
        </div>
      </footer>
    </div>
  );
};
