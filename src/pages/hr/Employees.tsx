import { useState, useEffect } from "react";
import { useERPStore } from "@/lib/store-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, User as UserIcon, Filter, MoreHorizontal, Mail, Phone, MapPin, Briefcase, Building2, Calendar, CreditCard, ShieldCheck, ArrowLeft, MoreVertical, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Employees = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const { activeStoreId } = useERPStore();

    const [formData, setFormData] = useState({
        user_id: "",
        department: "",
        designation: "",
        salary: "",
        joining_date: new Date().toISOString().split('T')[0],
        documents: [] as string[]
    });

    const loadData = async () => {
        setLoading(true);
        try {
            if (window.electronAPI) {
                const fetchedUsers = await window.electronAPI.getUsers();
                setUsers(fetchedUsers);

                const emps = await window.electronAPI.getEmployees(activeStoreId || 'store-1');
                setEmployees(emps);
            }
        } catch (error) {
            console.error(error);
            toast.error("DATA_LINK_FAILURE: Failed to synchronize workforce registry.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (window.electronAPI) {
                const newEmployee = {
                    id: `emp-${Date.now()}`,
                    userId: formData.user_id,
                    department: formData.department,
                    designation: formData.designation,
                    salary: parseFloat(formData.salary),
                    joiningDate: formData.joining_date,
                    documents: formData.documents,
                    storeId: activeStoreId || 'store-1'
                };

                await window.electronAPI.addEmployee(newEmployee);
                toast.success("Profile Integrated: Member node authorized.");
                setIsOpen(false);
                loadData();
            }
        } catch (error) {
            console.error(error);
            toast.error("PROTOCOL_ERROR: Profile generation failed.");
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => window.history.back()} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Workforce Directory</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Registry of active personnel nodes • {filteredEmployees.length} Units</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="group relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-black transition-colors" />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="IDENTIFY UNIT..."
                                className="h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 text-[10px] font-black uppercase focus:ring-2 focus:ring-black w-64 placeholder:text-slate-200"
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <Plus className="w-4 h-4 mr-2" />
                                    GENERATE PROFILE
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl rounded-[3rem] p-12 border-none">
                                <DialogHeader className="mb-8">
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Personnel Construction</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Association</Label>
                                            <Select
                                                value={formData.user_id}
                                                onValueChange={(val) => setFormData({ ...formData, user_id: val })}
                                            >
                                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase">
                                                    <SelectValue placeholder="SELECT NODE" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                    {users.map(user => (
                                                        <SelectItem key={user.id} value={user.id} className="text-[11px] font-black uppercase">{user.name || user.email}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Class</Label>
                                            <Select
                                                value={formData.department}
                                                onValueChange={(val) => setFormData({ ...formData, department: val })}
                                            >
                                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase">
                                                    <SelectValue placeholder="SELECT SECTOR" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                    <SelectItem value="Management" className="text-[11px] font-black uppercase">SUPER_ADMIN</SelectItem>
                                                    <SelectItem value="HR" className="text-[11px] font-black uppercase">HR_MANAGEMENT</SelectItem>
                                                    <SelectItem value="Sales" className="text-[11px] font-black uppercase">SALES_OPERATION</SelectItem>
                                                    <SelectItem value="Inventory" className="text-[11px] font-black uppercase">INVENTORY_CONTROL</SelectItem>
                                                    <SelectItem value="Account" className="text-[11px] font-black uppercase">FISCAL_ACCOUNT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Designation Registry</Label>
                                            <Input
                                                value={formData.designation}
                                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                placeholder="E.G. SYSTEMS_ARCHITECT"
                                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fiscal Comp (Monthly)</Label>
                                            <Input
                                                type="number"
                                                value={formData.salary}
                                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation Date</Label>
                                            <Input
                                                type="date"
                                                value={formData.joining_date}
                                                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6">
                                        <Button type="button" variant="ghost" className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400" onClick={() => setIsOpen(false)}>Abort</Button>
                                        <Button type="submit" className="h-14 px-12 rounded-2xl bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20">Authorize Unit</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-white min-h-[700px]">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Unit Directory Registry</h3>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" className="h-10 px-6 rounded-xl bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:bg-slate-100 hover:text-black transition-all">
                                <Filter className="w-4 h-4" />
                                Sector Filtering
                            </Button>
                        </div>
                    </div>

                    {filteredEmployees.length > 0 ? (
                        <div className="space-y-3">
                            {filteredEmployees.map((emp) => (
                                <div key={emp.id} className="bg-slate-50 hover:bg-white p-8 rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-8 flex-1">
                                        <div className="w-20 h-20 bg-white rounded-[1.8rem] flex items-center justify-center text-slate-200 group-hover:text-black group-hover:bg-slate-50 transition-all shadow-sm shrink-0 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <UserIcon className="w-8 h-8 relative z-10" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-slate-400 font-mono">UNIT_{emp.id.substring(4, 12).toUpperCase()}</span>
                                                <div className="px-4 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {emp.department.toUpperCase()}
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate mb-2">{emp.user?.name || "IDENTITY_UNKNOWN"}</h4>
                                            <div className="flex flex-wrap gap-x-8 gap-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> {emp.designation.toUpperCase()}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> SINCE {emp.joining_date}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> COMP: ${Number(emp.salary).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end md:self-center">
                                        <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white text-slate-200 hover:text-black border border-slate-100 shadow-sm transition-all group-hover:border-slate-200">
                                            <FileText className="w-5 h-5" />
                                        </Button>
                                        <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white text-slate-200 hover:text-black border border-slate-100 shadow-sm transition-all group-hover:border-slate-200">
                                            <MoreVertical className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-40 text-center opacity-30">
                            <Ghost className="w-24 h-24 text-slate-100 mx-auto mb-8" />
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Registry Latency</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-20 text-center mx-auto max-w-lg">
                                No personnel units detected in current sector parameters. Initialize profile construction to populate directory.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Employees;
