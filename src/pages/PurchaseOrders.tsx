import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore, PurchaseOrder } from '@/lib/store-data';
import { Plus, Search, FileText, Calendar, ChevronRight, Filter, Download, Zap, TrendingUp, TrendingDown, Clock, ShieldCheck, Box, CreditCard, MoreHorizontal, ArrowLeft, Truck, PackageCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function PurchaseOrders() {
    const navigate = useNavigate();
    const { purchaseOrders, activeStoreId, addPurchaseOrder, updatePurchaseOrder } = useERPStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

    // New PO State
    const [newPO, setNewPO] = useState({
        supplier: '',
        totalAmount: '',
    });

    const filteredPOs = purchaseOrders.filter(p =>
        p.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalOrdersValue = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);
    const pendingOrders = purchaseOrders.filter(p => p.status === 'sent' || p.status === 'draft').length;
    const receivedOrders = purchaseOrders.filter(p => p.status === 'received').length;

    const handleAddPO = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPO.supplier || !newPO.totalAmount) {
            toast.error('Please fill in the supplier name and amount.');
            return;
        }

        try {
            await addPurchaseOrder({
                supplier: newPO.supplier,
                items: [],
                totalAmount: parseFloat(newPO.totalAmount),
                status: 'draft',
                storeId: activeStoreId,
                date: new Date().toISOString()
            });
            toast.success('Purchase order saved as draft.');
            setIsAddOpen(false);
            setNewPO({ supplier: '', totalAmount: '' });
        } catch (error) {
            toast.error('Failed to save purchase order. Please try again.');
        }
    };

    const handleStatusUpdate = async (id: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const nextStatus = currentStatus === 'draft' ? 'sent' : currentStatus === 'sent' ? 'received' : 'draft';
        await updatePurchaseOrder(id, { status: nextStatus, updatedAt: new Date().toISOString() });
        toast.success(`Status updated to ${nextStatus.toUpperCase()}`);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'received': return { icon: <CheckCircle2 className="w-3 h-3" />, class: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Received' };
            case 'sent': return { icon: <Truck className="w-3 h-3" />, class: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'In Transit' };
            case 'draft': return { icon: <Clock className="w-3 h-3" />, class: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Draft' };
            default: return { icon: <AlertCircle className="w-3 h-3" />, class: 'bg-slate-50 text-slate-500 border-slate-100', label: status };
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Purchase Orders</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Order registry • {filteredPOs.length} Orders</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="group relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-black transition-colors" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="TRACK ORDER..."
                                className="h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 text-[10px] font-black uppercase focus:ring-2 focus:ring-black w-64 placeholder:text-slate-200"
                            />
                        </div>

                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New order
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[3rem] p-12 max-w-xl border-none shadow-2xl animate-in fade-in zoom-in duration-300">
                                <DialogHeader className="mb-8">
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Purchase Order</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create a new purchase order.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddPO} className="space-y-8 pt-4">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Supplier Name</Label>
                                        <Input
                                            value={newPO.supplier}
                                            onChange={e => setNewPO({ ...newPO, supplier: e.target.value.toUpperCase() })}
                                            className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                                            placeholder="SUPPLIER NAME"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Total Amount</Label>
                                        <Input
                                            type="number"
                                            value={newPO.totalAmount}
                                            onChange={e => setNewPO({ ...newPO, totalAmount: e.target.value })}
                                            className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-2xl font-black focus:ring-2 focus:ring-black"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Cancel</Button>
                                        <Button type="submit" className="flex-1 h-16 rounded-[1.2rem] bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20">Save Order</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                {/* Pipeline Performance Gauges */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                        <div className="p-3 bg-indigo-50 rounded-xl w-fit mb-6 text-indigo-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{fmt(totalOrdersValue)}</h3>
                    </div>
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                        <div className="p-3 bg-amber-50 rounded-xl w-fit mb-6 text-amber-500">
                            <Clock className="w-5 h-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Orders</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{pendingOrders}</h3>
                    </div>
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                        <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-6 text-emerald-500">
                            <PackageCheck className="w-5 h-5" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Received Orders</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{receivedOrders}</h3>
                    </div>
                    <div className="bg-black rounded-[2rem] p-8 text-white shadow-xl shadow-black/10 flex flex-col justify-center relative overflow-hidden group">
                        <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Export</p>
                            <Button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl h-12 font-black uppercase text-[9px] tracking-widest">
                                <Download className="w-3.5 h-3.5 mr-2" />
                                Export All
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Pipeline Stream */}
                <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white min-h-[600px]">
                    <div className="flex items-center justify-between mb-12">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">All Orders</h3>
                    </div>

                    {filteredPOs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPOs.map((po, idx) => {
                                const status = getStatusConfig(po.status);
                                return (
                                    <div
                                        key={po.id}
                                        className="bg-slate-50 hover:bg-white p-8 rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={cn("px-4 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-widest flex items-center gap-2", status.class)}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                            <div className="p-2 bg-white rounded-xl text-slate-200 group-hover:text-black transition-colors shadow-sm">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="space-y-1 mb-8">
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{po.supplier}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">ID: {po.id.substring(0, 8).toUpperCase()}</p>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                        {new Date(po.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Box className="w-3 h-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                                        {po.items?.length || 0} Items
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900 tracking-tighter mb-4">{fmt(po.totalAmount)}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                    onClick={(e) => handleStatusUpdate(po.id, po.status, e)}
                                                >
                                                    Mark {po.status === 'draft' ? 'Sent' : po.status === 'sent' ? 'Received' : 'Draft'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-40 text-center opacity-30">
                            <FileText className="w-24 h-24 text-slate-100 mx-auto mb-8" />
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No Orders Yet</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-20 text-center mx-auto max-w-lg">
                                Start by creating a new purchase order.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Elevated FAB */}
            <button
                onClick={() => setIsAddOpen(true)}
                className="fixed bottom-12 right-12 w-20 h-20 bg-black text-white rounded-full shadow-2xl shadow-black/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-8 h-8 relative z-10" />
            </button>
        </div>
    );
}

const Activity = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);
