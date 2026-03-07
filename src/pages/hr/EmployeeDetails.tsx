import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useERPStore, Employee, HRAttendance, HRLeave, HRPayroll } from "@/lib/store-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User, Mail, Phone, MapPin, Briefcase, Calendar,
    CreditCard, ShieldCheck, ArrowLeft, Clock,
    CheckCircle2, XCircle, AlertCircle, Plus,
    FileText, Calculator, Landmark, History,
    TrendingUp, TrendingDown, Star, Printer, Download
} from "lucide-react";
import { cn, toWords } from "@/lib/utils";
import { toast } from "sonner";
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeeDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        activeStoreId,
        users,
        hrAttendance,
        hrLeaves,
        hrPayroll,
        fetchAttendance,
        fetchLeaves,
        fetchPayroll,
        addPayroll
    } = useERPStore();

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [payrollOpen, setPayrollOpen] = useState(false);
    const [payslipOpen, setPayslipOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<HRPayroll | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const [payrollData, setPayrollData] = useState({
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        status: 'draft' as 'draft' | 'paid'
    });

    useEffect(() => {
        const loadEmployee = async () => {
            setLoading(true);
            try {
                if (window.electronAPI) {
                    const emps = await window.electronAPI.getEmployees(activeStoreId || 'store-1');
                    const emp = emps?.find(e => e.id === id);
                    if (emp) {
                        setEmployee(emp);
                        setPayrollData(prev => ({ ...prev, basicSalary: emp.salary }));
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load employee details.");
            } finally {
                setLoading(false);
            }
        };

        loadEmployee();
        fetchAttendance();
        fetchLeaves();
        fetchPayroll();
    }, [id, activeStoreId, fetchAttendance, fetchLeaves, fetchPayroll]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6">
                <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-black uppercase text-slate-900">Employee Not Found</h2>
                <Button onClick={() => navigate('/hr/employees')} className="mt-6 bg-black text-white rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                    Return to Directory
                </Button>
            </div>
        );
    }

    const empAttendance = hrAttendance.filter(a => a.employeeId === employee.id);
    const empLeaves = hrLeaves.filter(l => l.employeeId === employee.id);
    const empPayroll = hrPayroll.filter(p => p.employeeId === employee.id);

    const handleAddPayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addPayroll({
                employeeId: employee.id,
                month: payrollData.month,
                basicSalary: payrollData.basicSalary,
                allowances: payrollData.allowances,
                deductions: payrollData.deductions,
                netSalary: payrollData.basicSalary + payrollData.allowances - payrollData.deductions,
                status: payrollData.status,
            });
            toast.success("Payroll record added successfully.");
            setPayrollOpen(false);
            fetchPayroll(); // Ensure it refreshes
        } catch (error) {
            toast.error("Failed to add payroll record.");
        }
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Payslip - ${employee.user?.name}</title>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                        body { font-family: 'Inter', sans-serif; padding: 40px; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/hr/employees')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{employee.user?.name}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{employee.designation} • {employee.department}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-black text-white rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20">
                                    <Plus className="w-4 h-4 mr-2" />
                                    GENERATE PAYROLL
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Generate Payroll</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddPayroll} className="space-y-6 mt-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month / Period</Label>
                                        <Input value={payrollData.month} onChange={e => setPayrollData(p => ({ ...p, month: e.target.value }))} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Salary</Label>
                                            <Input type="number" value={payrollData.basicSalary} onChange={e => setPayrollData(p => ({ ...p, basicSalary: Number(e.target.value) }))} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allowances</Label>
                                            <Input type="number" value={payrollData.allowances} onChange={e => setPayrollData(p => ({ ...p, allowances: Number(e.target.value) }))} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deductions</Label>
                                        <Input type="number" value={payrollData.deductions} onChange={e => setPayrollData(p => ({ ...p, deductions: Number(e.target.value) }))} className="h-12 bg-slate-50 border-none rounded-xl font-bold" />
                                    </div>
                                    <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Net Disbursement</p>
                                            <p className="text-xl font-black tracking-tight">PKR {(payrollData.basicSalary + payrollData.allowances - payrollData.deductions).toLocaleString()}</p>
                                        </div>
                                        <Select value={payrollData.status} onValueChange={(v: 'draft' | 'paid' | 'processed') => setPayrollData(p => ({ ...p, status: v }))}>
                                            <SelectTrigger className="w-28 h-10 bg-white/10 border-none text-[10px] font-black uppercase text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">PENDING</SelectItem>
                                                <SelectItem value="paid">PAID</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20">
                                        COMMIT TO LEDGER
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 mt-12">
                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar: Profile Overview */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-300 mb-6 border-4 border-slate-50">
                                <User className="w-10 h-10" />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{employee.user?.name}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {employee.id.substring(0, 8).toUpperCase()}</p>

                            <div className="w-full h-px bg-slate-50 my-6" />

                            <div className="w-full space-y-4 text-left">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-slate-300" />
                                    <span className="text-[11px] font-bold text-slate-600 truncate">{employee.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-4 h-4 text-slate-300" />
                                    <span className="text-[11px] font-bold text-slate-600">{employee.designation}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-slate-300" />
                                    <span className="text-[11px] font-bold text-slate-600">Joined {employee.joiningDate}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-4 h-4 text-slate-300" />
                                    <span className="text-[11px] font-bold text-slate-600">PKR {employee.salary.toLocaleString()}/mo</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black rounded-[2.5rem] p-8 text-white shadow-xl shadow-black/10">
                            <div className="flex items-center gap-3 mb-6">
                                <Star className="w-5 h-5 text-amber-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Performance</h3>
                            </div>
                            <div className="text-center py-4">
                                <p className="text-4xl font-black italic tracking-tighter">A+</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Current Efficiency</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Tabs */}
                    <div className="lg:col-span-3">
                        <Tabs defaultValue="overview" className="space-y-8">
                            <TabsList className="bg-white h-16 p-2 rounded-2xl border border-white shadow-sm gap-2">
                                <TabsTrigger value="overview" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-black data-[state=active]:text-white">Overview</TabsTrigger>
                                <TabsTrigger value="attendance" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-black data-[state=active]:text-white">Attendance</TabsTrigger>
                                <TabsTrigger value="payroll" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-black data-[state=active]:text-white">Payroll</TabsTrigger>
                                <TabsTrigger value="documents" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-black data-[state=active]:text-white">Documents</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-8 mt-0">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                        <CardHeader className="bg-white p-8 border-b border-slate-50">
                                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                                <History className="w-4 h-4 text-indigo-500" /> Recent Activity
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="bg-white p-0">
                                            <div className="divide-y divide-slate-50">
                                                {empAttendance.slice(0, 5).map(a => (
                                                    <div key={a.id} className="p-6 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                                <Clock className="w-5 h-5 text-slate-300" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-slate-900 uppercase">Clock In Record</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{a.date}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">{a.checkIn}</span>
                                                    </div>
                                                ))}
                                                {empAttendance.length === 0 && (
                                                    <div className="p-12 text-center opacity-20">
                                                        <FileText className="w-10 h-10 mx-auto mb-2" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No activity logged</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-8">
                                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-[10px] font-black uppercase tracking-widest">Attendance Status</h3>
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Present</p>
                                                    <p className="text-2xl font-black text-slate-900">{empAttendance.filter(a => a.status === 'present').length} Days</p>
                                                </div>
                                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Late</p>
                                                    <p className="text-2xl font-black text-rose-500">{empAttendance.filter(a => a.status === 'late').length} Days</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
                                            <div className="flex items-center gap-3 mb-8">
                                                <History className="w-5 h-5 text-indigo-500" />
                                                <h3 className="text-[10px] font-black uppercase tracking-widest">Leave Balance</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-[11px] font-bold">
                                                    <span className="text-slate-400 uppercase">Casual Leaves</span>
                                                    <span className="text-slate-900">12 / 15 Remaining</span>
                                                </div>
                                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full w-[80%]" />
                                                </div>
                                                <div className="flex justify-between items-center text-[11px] font-bold">
                                                    <span className="text-slate-400 uppercase">Sick Leaves</span>
                                                    <span className="text-slate-900">08 / 08 Remaining</span>
                                                </div>
                                                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                                    <div className="h-full bg-rose-500 rounded-full w-[100%]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="attendance" className="mt-0">
                                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                    <CardHeader className="bg-white p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Full Attendance Ledger</CardTitle>
                                    </CardHeader>
                                    <CardContent className="bg-white p-0">
                                        <div className="divide-y divide-slate-50">
                                            {empAttendance.map(a => (
                                                <div key={a.id} className="p-8 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-8">
                                                        <div className="text-center min-w-[60px]">
                                                            <p className="text-[14px] font-black text-slate-900 uppercase">{new Date(a.date).toLocaleDateString('en-US', { day: '2-digit' })}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(a.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                                        </div>
                                                        <div className="h-10 w-px bg-slate-100" />
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-900 uppercase">Shift Timing</p>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <Clock className="w-3 h-3 text-slate-300" />
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">{a.checkIn} — {a.checkOut || 'Active'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={cn("px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border",
                                                        a.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            a.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                                    )}>
                                                        {a.status}
                                                    </div>
                                                </div>
                                            ))}
                                            {empAttendance.length === 0 && (
                                                <div className="py-32 text-center opacity-20">
                                                    <Ghost className="w-16 h-16 mx-auto mb-4" />
                                                    <p className="text-sm font-black uppercase tracking-widest">Registry Empty</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="payroll" className="mt-0">
                                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                    <CardHeader className="bg-white p-8 border-b border-slate-50">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-widest">Payroll History</CardTitle>
                                    </CardHeader>
                                    <CardContent className="bg-white p-0">
                                        <div className="divide-y divide-slate-50">
                                            {empPayroll.map(p => (
                                                <div key={p.id} className="p-8 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-10">
                                                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-black group-hover:text-white transition-all">
                                                            <Calculator className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{p.month}</h4>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: {p.status}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Payout</p>
                                                            <p className="text-xl font-black text-slate-900 tracking-tighter">PKR {p.netSalary.toLocaleString()}</p>
                                                        </div>
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedPayroll(p);
                                                                setPayslipOpen(true);
                                                            }}
                                                            variant="outline"
                                                            className="rounded-xl h-12 border-slate-100 hover:bg-slate-50 font-black text-[9px] tracking-widest uppercase"
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            PAYSLIP
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {empPayroll.length === 0 && (
                                                <div className="py-32 text-center opacity-20">
                                                    <Landmark className="w-16 h-16 mx-auto mb-4" />
                                                    <p className="text-sm font-black uppercase tracking-widest">No payout records found</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="documents" className="mt-0">
                                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                    <CardContent className="p-20 text-center flex flex-col items-center">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8">
                                            <FileText className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase text-slate-900">Virtual Filing Cabinet</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">Secure document storage for CNIC, Contracts, and Education certificates.</p>
                                        <Button className="mt-10 bg-black text-white rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] transition-all">
                                            UPLOAD NEW DOCUMENT
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            <Dialog open={payslipOpen} onOpenChange={setPayslipOpen}>
                <DialogContent className="max-w-[800px] p-0 border-none bg-white rounded-[2rem] overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center no-print">
                        <h2 className="text-xl font-black uppercase tracking-tight">Preview Payslip</h2>
                        <Button onClick={handlePrint} className="bg-black text-white rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                            <Printer className="w-4 h-4 mr-2" />
                            Print / PDF
                        </Button>
                    </div>

                    <div ref={printRef} className="p-12 space-y-12 text-slate-900">
                        {/* Payslip Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center p-4">
                                    <img src="/invenza-bg.png" alt="Invenza Logo" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Invenza</h1>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Hardware Central [Main Branch]</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-black uppercase tracking-widest text-slate-300">Official Payslip</h2>
                                <p className="text-[12px] font-bold text-slate-900 mt-1">{selectedPayroll?.month}</p>
                            </div>
                        </div>

                        {/* Employee Summary */}
                        <div className="grid grid-cols-2 gap-12 bg-slate-50/50 p-10 rounded-[2rem]">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name:</span>
                                    <span className="text-[12px] font-black uppercase">{employee.user?.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation:</span>
                                    <span className="text-[12px] font-bold uppercase">{employee.designation}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID:</span>
                                    <span className="text-[12px] font-mono font-bold uppercase">{employee.id.substring(0, 10)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end justify-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Pay Amount</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter">PKR {selectedPayroll?.netSalary.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Paid on: {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Earnings and Deductions Matrix */}
                        <div className="grid grid-cols-2 gap-12 pt-4">
                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 border-b border-emerald-100 pb-3">Earnings Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[13px]">
                                        <span className="font-bold text-slate-400">Basic Salary</span>
                                        <span className="font-black">PKR {selectedPayroll?.basicSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px]">
                                        <span className="font-bold text-slate-400">Allowances</span>
                                        <span className="font-black">PKR {selectedPayroll?.allowances.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t-2 border-slate-900 flex justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-widest">Gross Earnings</span>
                                        <span className="text-lg font-black tracking-tight">PKR {((selectedPayroll?.basicSalary || 0) + (selectedPayroll?.allowances || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500 border-b border-rose-100 pb-3">Deductions Matrix</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[13px]">
                                        <span className="font-bold text-slate-400">Other Deductions</span>
                                        <span className="font-black">PKR {selectedPayroll?.deductions.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t-2 border-slate-900 flex justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-widest">Total Deductions</span>
                                        <span className="text-lg font-black tracking-tight">PKR {selectedPayroll?.deductions.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="pt-12 mt-12 border-t-2 border-slate-900">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Amount in Words</p>
                                    <p className="text-[14px] font-black italic tracking-wide">
                                        {selectedPayroll ? toWords(selectedPayroll.netSalary) : ''}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black tracking-tighter uppercase mb-1">Invenza ERP</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Verification Key: {selectedPayroll?.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Ghost(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 10h.01" />
            <path d="M15 10h.01" />
            <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
        </svg>
    )
}
