import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore, User } from '@/lib/store-data';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ShieldCheck, UserCheck, Briefcase, Calculator, ShieldAlert, Building2, Eye, EyeOff, Save, ArrowLeft, UserPlus, Zap, CheckCircle2 } from 'lucide-react';

export default function NewUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addUser, updateUser, users, stores } = useERPStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('employee');
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [showPassword, setShowPassword] = useState(false);

  const [createEmployee, setCreateEmployee] = useState(false);

  const isEdit = Boolean(id);

  useEffect(() => {
    if (isEdit && users.length > 0) {
      const user = users.find(u => u.id === id);
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setStoreId(user.storeId || '');
      }
    }
  }, [id, isEdit, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      name,
      email,
      role,
      storeId,
      ...(password ? { password } : {})
    };

    try {
      if (isEdit) {
        updateUser(id!, userData);
        toast.success("Node Synchronized: Member profile updated.");
      } else {
        const generatedId = `user-${Date.now()}`;
        await addUser({
          id: generatedId,
          name,
          email,
          role,
          password,
          storeId,
          isStaff: role !== 'user',
          isActive: true
        });

        if (createEmployee && window.electronAPI) {
          let dept = 'General';
          if (role === 'hr_manager') dept = 'HR Manager';
          else if (role === 'sales_manager') dept = 'Sales Manager';
          else if (role === 'inventory_manager') dept = 'Inventory Manager';
          else if (role === 'accountant') dept = 'Account';
          else if (role === 'super_admin' || role === 'admin') dept = 'Super Admin';

          await window.electronAPI.addEmployee({
            id: `emp-${Date.now()}`,
            userId: generatedId,
            department: dept,
            designation: role.replace('_', ' ').toUpperCase(),
            salary: 0,
            joiningDate: new Date().toISOString().split('T')[0],
            documents: [],
            storeId: storeId
          });
        }
        toast.success("Onboarding Finalized: Member node injected into collective.");
      }
      navigate('/users');
    } catch (error) {
      toast.error("PROTOCOL FAILURE: Registry rejected member payload.");
    }
  };

  const roles = [
    { id: 'user', label: 'Store User', category: 'Basic' },
    { id: 'staff', label: 'Store Staff', category: 'Basic' },
    { id: 'employee', label: 'General Employee', category: 'Basic' },
    { id: 'hr_manager', label: 'HR Manager', category: 'Management' },
    { id: 'sales_manager', label: 'Sales Manager', category: 'Management' },
    { id: 'inventory_manager', label: 'Inventory Manager', category: 'Management' },
    { id: 'accountant', label: 'Accountant', category: 'Management' },
    { id: 'admin', label: 'Store Admin', category: 'Admin' },
    { id: 'super_admin', label: 'Super Admin', category: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-40">
      {/* Superior Header */}
      <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/users')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isEdit ? 'Member Synthesis' : 'Member Onboarding'}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{isEdit ? 'Modifying existing node parameters' : 'Constructing new personnel node'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {isEdit ? 'Sync Node' : 'Finalize Onboarding'}
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Matrix */}
          <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-lg shadow-indigo-100">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Identity Matrix</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Assigning core identification parameters</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name (Identifier)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                  placeholder="E.G. JOHN_SMITH_NODE"
                  required
                />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Communication Channel (Email)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black lowercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                  placeholder="member@collective.com"
                  required
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Access Credential (Password)</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black focus:ring-2 focus:ring-black placeholder:text-slate-200"
                    placeholder="••••••••"
                    required={!isEdit}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Privilege Allocation */}
          <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-lg shadow-emerald-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Privilege Allocation</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Defining clearance and operational scope</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((r) => {
                if (r.id === '---') return <div key={r.id} className="col-span-full border-t border-slate-50 my-2" />;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as User['role'])}
                    className={cn(
                      "p-6 rounded-[2rem] text-left transition-all duration-300 border-2",
                      role === r.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200"
                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <p className={cn("text-[7px] font-black uppercase tracking-widest mb-2", role === r.id ? "text-white/40" : "text-slate-400")}>{r.category}</p>
                    <p className="text-[10px] font-black uppercase tracking-tight">{r.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Node Placement */}
          <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl shadow-black/20 overflow-hidden relative group">
            <Zap className="absolute -right-10 -top-10 w-40 h-40 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
            <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">Node Placement</h4>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Sector Assignment</Label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full h-16 bg-white/10 border-none rounded-2xl px-6 text-xs font-black uppercase text-white focus:ring-2 focus:ring-white/20 appearance-none pointer-events-auto"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900">
                        {s.name.toUpperCase()} - {s.branch.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {!isEdit && (
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-start gap-4 cursor-pointer group" onClick={() => setCreateEmployee(!createEmployee)}>
                      <div className={cn("w-5 h-5 mt-1 rounded-md border flex items-center justify-center transition-all", createEmployee ? "bg-white border-white text-black" : "border-white/20 text-transparent")}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1">HR Synthesis</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed">Automate personnel profile construction in parallel.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Protocol</p>
            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl mb-8">
              <ShieldAlert className="w-10 h-10 text-rose-500" />
            </div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Immutable Protocol</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">All personnel modifications are logged to the global activity stream for audit verification.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
