import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Train, ShieldCheck, Mail, Lock, User, ArrowRight, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login'); // login | register | otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useToast();

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form
  const [regData, setRegData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });

  // OTP form
  const [otp, setOtp] = useState('');

  const redirect = searchParams.get('redirect') || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const user = res.loggedInUser || res.data?.user || res.data;
      setUser(user);
      showToast('Welcome back! Login successful.', 'success');
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(regData);
      showToast('Verification code dispatched to your email!', 'success');
      setTab('otp');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp(otp);
      showToast('Email verified successfully! You can now log in.', 'success');
      setEmail(regData.email);
      setTab('login');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-neon">
            <Train className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            IRCTC NextGen Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access secure ticket bookings & instant passenger services
          </p>
        </div>

        <div className="card bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-6 sm:p-8">
          {/* Tabs */}
          {tab !== 'otp' && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className={`py-2 rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); }}
                className={`py-2 rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-primary-900 hover:from-cyan-500 hover:to-primary-800 text-white font-bold rounded-xl shadow-md hover:shadow-neon"
              >
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={regData.firstName}
                  onChange={(e) => setRegData({ ...regData, firstName: e.target.value })}
                  placeholder="Rahul"
                  required
                />
                <Input
                  label="Last Name"
                  value={regData.lastName}
                  onChange={(e) => setRegData({ ...regData, lastName: e.target.value })}
                  placeholder="Sharma"
                  required
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                placeholder="rahul.sharma@example.com"
                required
              />
              <Input
                label="Create Password"
                type="password"
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                placeholder="At least 6 characters"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={regData.confirmPassword}
                onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                required
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-primary-900 hover:from-cyan-500 hover:to-primary-800 text-white font-bold rounded-xl shadow-md hover:shadow-neon"
              >
                <span>Generate Verification OTP</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          )}

          {/* OTP Form */}
          {tab === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 leading-relaxed">
                A 6-digit confirmation code was dispatched to <strong>{regData.email}</strong>. Please enter it below:
              </div>
              <Input
                label="Verification Code (OTP)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
                className="text-center font-mono tracking-widest text-lg font-black"
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-primary-900 hover:from-cyan-500 hover:to-primary-800 text-white font-bold rounded-xl shadow-md hover:shadow-neon"
              >
                <span>Verify & Complete Registration</span>
              </Button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className="text-xs text-slate-500 hover:text-cyan-700 font-semibold w-full text-center py-1"
              >
                ← Edit registration details
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure 256-bit encrypted authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
