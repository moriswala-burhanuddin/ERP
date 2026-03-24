import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERPStore } from '@/lib/store-data';
import { Store, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, ArrowRight, Fingerprint, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '../assets/invenza-bg.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useERPStore();
  const [email, setEmail] = useState('admin@hardware.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const user = useERPStore.getState().currentUser;
        if (user?.role === 'hr_manager') navigate('/hr');
        else if (user?.role === 'sales_manager') navigate('/sales');
        else if (user?.role === 'inventory_manager') navigate('/products');
        else if (user?.role === 'accountant') navigate('/transactions');
        else if (user?.role === 'employee') navigate('/employee/dashboard');
        else navigate('/');
      } else {
        setError(result.message || 'Login failed: Please check your email and password.');
      }
    } catch (err) {
      setError('System error: Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] relative overflow-hidden font-sans">
      {/* Background Synthesis */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/30 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/30 rounded-full blur-[160px] animate-pulse delay-700" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="w-full max-w-[480px] px-6 relative z-10">
        <div className="bg-[#141417]/80 backdrop-blur-3xl rounded-[4rem] p-12 shadow-[0_32px_128px_rgba(0,0,0,0.8)] border border-white/5 relative overflow-hidden">

          {/* Subtle Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent animate-scan" />

          {/* Header Section */}
          <div className="flex flex-col items-center mb-14 text-center">
            <div className="relative mb-8 group">
              <div className="absolute -inset-4 bg-indigo-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-emerald-500 p-[1px] shadow-2xl shadow-indigo-500/20 transition-transform duration-700 group-hover:scale-105 group-hover:rotate-6">
                <div className="w-full h-full bg-[#0A0A0B] rounded-[2.4rem] flex items-center justify-center overflow-hidden">
                  <img src={logo} alt="Invenza Logo" className="w-[70%] h-[70%] object-contain" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-[#141417]">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-3">Invenza<span className="text-indigo-500 text-5xl">.</span></h1>
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-5 py-2 rounded-full">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Version 3.0</span>
            </div>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest p-5 rounded-[1.8rem] flex items-center gap-4 border border-rose-500/20 animate-shake">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 hover:bg-white/[0.08]"
                  placeholder="yourname@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-3">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-5 pl-14 pr-14 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 hover:bg-white/[0.08]"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black h-20 rounded-[2.2rem] font-black uppercase tracking-[0.3em] text-xs shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  LOGIN NOW
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Metrics */}
          <div className="mt-14 pt-10 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-white">SECURE</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Support ID</span>
              <span className="text-[10px] font-black text-white">SF-CORE-992</span>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-12 leading-relaxed">
          Authorized Users Only • System Active • Direct Connection
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
