import { useState, useEffect } from "react";
import { useERPStore } from "@/lib/store-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, CalendarCheck, UserX, CreditCard, FileText, Zap, TrendingUp, ShieldCheck, Activity, Target, Brain, Briefcase, Plus, Search, ChevronRight, Bell, Gauge } from "lucide-react";
import { AttendanceRiskCard, RiskEmployee } from "@/components/hr/AttendanceRiskCard";
import { HRAttendance } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HRDashboardProps {
    isEmployeeView?: boolean;
}

const HRDashboard = ({ isEmployeeView = false }: HRDashboardProps) => {
    const { currentUser, getStoreSales, getStoreProducts, getStoreCustomers, getActiveStore } = useERPStore();
    const [dateRange, setDateRange] = useState('today');

    const sales = getStoreSales();
    const products = getStoreProducts();
    const customers = getStoreCustomers();
    const activeStore = getActiveStore();
    const [attendanceStats, setAttendanceStats] = useState({
        present: 0,
        late: 0,
        absent: 0,
        total: 0
    });

    interface AIReport {
        employees: RiskEmployee[];
        summary: string;
    }

    interface AIPerformanceReport {
        topPerformers: Array<{ name: string; reason: string; score: string | number }>;
        riskAlerts: Array<{ name: string; riskLevel: string; reason: string }>;
    }

    const [report, setReport] = useState<AIReport | null>(null);
    const [performanceReport, setPerformanceReport] = useState<AIPerformanceReport | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const loadData = async () => {
        try {
            if (window.electronAPI) {
                const today = new Date().toISOString().split('T')[0];
                const att = (await window.electronAPI.getAttendance(undefined, today, today)) || [];
                const users = (await window.electronAPI.getUsers()) || [];
                const totalStaff = users.length;

                setAttendanceStats({
                    present: att.filter((a: HRAttendance) => a.status === 'present').length,
                    late: att.filter((a: HRAttendance) => a.status === 'late').length,
                    absent: Math.max(0, totalStaff - att.length),
                    total: totalStaff
                });
            }
        } catch (err) {
            console.error("HR LoadData Error:", err);
        }
    };

    const runAIAnalysis = async () => {
        if (!window.electronAPI) return;
        setAnalyzing(true);
        toast.info("Initializing Workforce Engine...");
        try {
            const [attHistory, leaves, performanceAnalysis] = await Promise.all([
                window.electronAPI.getAttendance(undefined, undefined, undefined),
                window.electronAPI.getLeaves('store-1'),
                window.electronAPI.analyzePerformance('store-1')
            ]);

            const analysis = await window.electronAPI.analyzeAttendance(attHistory, leaves);
            setReport(analysis);
            setPerformanceReport(performanceAnalysis);
            toast.success("Intelligence Synthesis Complete");
        } catch (e) {
            console.error(e);
            setReport(null);
            setPerformanceReport(null);
            toast.error("Synthesis Protocol Failure");
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        loadData();
        runAIAnalysis();
    }, []);

    const navItems = [
        { label: 'Employees', icon: <Users className="w-4 h-4" />, href: '#/hr/employees' },
        { label: 'Attendance', icon: <Clock className="w-4 h-4" />, href: '#/hr/attendance' },
        { label: 'Leaves', icon: <CalendarCheck className="w-4 h-4" />, href: '#/hr/leaves' },
        { label: 'Payroll', icon: <CreditCard className="w-4 h-4" />, href: '#/hr/payroll' },
        { label: 'Performance', icon: <Target className="w-4 h-4" />, href: '#/hr/performance' },
    ];

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-black rounded-2xl text-white shadow-xl shadow-slate-200">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isEmployeeView ? `Welcome, ${currentUser?.name || 'MEMBER'}` : 'Human Capital Hub'}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{isEmployeeView ? 'Individual Development Profile' : 'Workforce Intelligence Center'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isEmployeeView ? (
                            <div className="flex gap-2">
                                {navItems.map((item) => (
                                    <Button key={item.label} variant="ghost" onClick={() => window.location.hash = item.href} className="h-12 rounded-2xl bg-slate-50 font-black uppercase text-[9px] tracking-widest text-slate-400 px-6 gap-2 hover:bg-slate-100 hover:text-black transition-all">
                                        {item.icon}
                                        {item.label}
                                    </Button>
                                ))}
                                <Button onClick={runAIAnalysis} disabled={analyzing} className="h-12 rounded-2xl bg-black text-white px-8 font-black uppercase text-[9px] tracking-widest gap-2 shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <Brain className={cn("w-4 h-4", analyzing && "animate-pulse")} />
                                    {analyzing ? 'Synthesizing...' : 'Calibrate Insights'}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button onClick={() => window.location.hash = '#/employee/attendance'} className="h-12 rounded-2xl bg-black text-white px-10 font-black uppercase text-[9px] tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Mark Entry</Button>
                                <Button variant="ghost" onClick={() => window.location.hash = '#/employee/leave'} className="h-12 rounded-2xl bg-slate-50 font-black uppercase text-[9px] tracking-widest text-slate-400 px-10 hover:bg-slate-100">Leave Protocol</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                {/* Global Metrics */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    {!isEmployeeView ? (
                        <>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-6 text-indigo-500">
                                    <Users className="w-5 h-5" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Presence</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{attendanceStats.present + attendanceStats.late} / {attendanceStats.total}</h3>
                            </div>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                <div className="p-3 bg-amber-50 rounded-xl w-fit mb-6 text-amber-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporal Variance (Late)</p>
                                <h3 className="text-2xl font-black text-amber-600 tracking-tighter">{attendanceStats.late} Indices</h3>
                            </div>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-6 text-emerald-500">
                                    <CalendarCheck className="w-5 h-5" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved Absence</p>
                                <h3 className="text-2xl font-black text-emerald-600 tracking-tighter">04 Nodes</h3>
                            </div>
                            <div className="bg-black rounded-[2rem] p-8 text-white shadow-xl shadow-black/10 relative overflow-hidden group">
                                <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Workforce Integrity</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Operational Level 94%</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                <div className="p-3 bg-green-50 rounded-xl w-fit mb-6 text-green-500">
                                    <CalendarCheck className="w-5 h-5" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cycle Fulfillment</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">22 / 24 Days</h3>
                            </div>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                <div className="p-3 bg-amber-50 rounded-xl w-fit mb-6 text-amber-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporal Lapses</p>
                                <h3 className="text-2xl font-black text-amber-600 tracking-tighter">02 Instances</h3>
                            </div>
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-6 text-indigo-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave Balance</p>
                                <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">12 Credits</h3>
                            </div>
                            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Next Disbursement</p>
                                <h3 className="text-2xl font-black tracking-tighter">MAR 01</h3>
                            </div>
                        </>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Main Feed Container */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                        <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white relative overflow-hidden group">
                            <Activity className="absolute -right-20 -top-20 w-80 h-80 text-slate-50 group-hover:text-indigo-50/50 transition-colors duration-1000" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Temporal Flux Registry</h3>
                                </div>
                                <div className="h-[300px] flex flex-col items-center justify-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center">
                                    <Gauge className="w-16 h-16 text-slate-100 mb-6" />
                                    <h4 className="text-xl font-black text-slate-300 uppercase tracking-tight">Visualization Node Offline</h4>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Integrating real-time chart protocols...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights Sidebar */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        {analyzing ? (
                            <div className="bg-black rounded-[3rem] p-12 text-center text-white space-y-6">
                                <Brain className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Synthesizing Personnel Metrics...</p>
                            </div>
                        ) : report && (
                            <div className="bg-white rounded-[3rem] p-1 shadow-sm border border-white overflow-hidden">
                                <div className="bg-black text-white p-8 rounded-[2.8rem] m-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest">Temporal Intelligence</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">{report.summary}</p>
                                </div>
                                <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto erp-scrollbar">
                                    {report.employees.map((emp, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 bg-rose-50/50 rounded-2xl border border-rose-100 group hover:bg-rose-50 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-900 border border-rose-100 shadow-sm">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[10px] uppercase tracking-tight text-rose-900 mb-0.5">{emp.name}</p>
                                                    <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{emp.riskLevel} ALERT</p>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="w-4 h-4 text-rose-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {performanceReport && (
                            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-white">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Fiscal Velocity</h3>
                                    </div>
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest tracking-[0.2em]">Alpha Audit</span>
                                </div>

                                <div className="space-y-4">
                                    {performanceReport.topPerformers.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 group hover:bg-emerald-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-emerald-600 shadow-sm border border-emerald-100">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[10px] uppercase text-emerald-900 mb-0.5">{p.name}</p>
                                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{p.reason}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-emerald-700">{p.score}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HRDashboard;
