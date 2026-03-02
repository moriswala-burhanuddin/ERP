import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore, SupplierTransaction, Supplier } from '@/lib/store-data';
import {
    Building2, Phone, Mail, MapPin, BadgeDollarSign,
    History, Plus, ArrowUpRight, ArrowDownLeft,
    Search, Star, Trash2, Edit, Globe, FileText,
    CreditCard, Hash, ShieldCheck, ReceiptText, AlertTriangle,
    Package, TrendingUp, TrendingDown, CheckCircle2, ArrowLeft, MoreHorizontal, Wallet, Activity, Zap, ShieldAlert, CheckCircle, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ── helpers ────────────────────────────────────────
const fmt = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const TX_COLORS: Record<string, string> = {
    purchase: 'bg-red-50 text-red-600 border-red-100',
    payment: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    credit_note: 'bg-blue-50 text-blue-700 border-blue-100',
    opening_balance: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TX_ICONS: Record<string, React.ReactNode> = {
    purchase: <ArrowUpRight className="w-3.5 h-3.5" />,
    payment: <ArrowDownLeft className="w-3.5 h-3.5" />,
    credit_note: <ReceiptText className="w-3.5 h-3.5" />,
    opening_balance: <Hash className="w-3.5 h-3.5" />,
};

// ── component ──────────────────────────────────────
export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';

    const {
        suppliers, purchases, paymentTerms,
        getSupplierLedger, addSupplierTransaction,
        activeStoreId, deleteSupplier
    } = useERPStore();

    const supplier = suppliers.find(s => s.id === id);
    const paymentTerm = paymentTerms.find(t => t.id === supplier?.paymentTermId);

    const [ledger, setLedger] = useState<SupplierTransaction[]>([]);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);
    const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
    const [txSearch, setTxSearch] = useState('');

    const linkedPurchases = purchases.filter(p =>
        p.supplier?.toLowerCase() === supplier?.companyName?.toLowerCase() ||
        p.supplier === supplier?.id
    );

    useEffect(() => {
        if (id && activeTab === 'ledger') loadLedger();
    }, [id, activeTab]);

    const loadLedger = async () => {
        setIsLoadingLedger(true);
        try {
            const data = await getSupplierLedger(id!);
            setLedger(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch {
            toast.error('Failed to load ledger indices');
        } finally {
            setIsLoadingLedger(false);
        }
    };

    if (!supplier) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-6 text-center">
                <div className="bg-white rounded-[3rem] p-12 shadow-xl max-w-md w-full border border-white">
                    <Building2 className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Source Extinct</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">The requested production node could not be identified.</p>
                    <Button onClick={() => navigate('/suppliers')} className="w-full bg-black text-white rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest">
                        Return to Registry
                    </Button>
                </div>
            </div>
        );
    }

    const handleDelete = async () => {
        if (window.confirm(`TERMINATION AUDIT: Remove ${supplier.companyName} from registry?`)) {
            await deleteSupplier(id!);
            toast.success('Supplier Identity Purged');
            navigate('/suppliers');
        }
    };

    const creditUtilization = supplier.creditLimit > 0
        ? Math.min((Math.abs(supplier.currentBalance) / supplier.creditLimit) * 100, 100)
        : 0;

    const isOverLimit = supplier.currentBalance > supplier.creditLimit && supplier.creditLimit > 0;

    const totalPurchased = ledger.filter(t => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
    const totalPaid = ledger.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);

    const TABS = [
        { key: 'profile', icon: <Building2 className="w-4 h-4" />, label: 'Matrix' },
        { key: 'ledger', icon: <History className="w-4 h-4" />, label: 'Ledger' },
        { key: 'purchases', icon: <Package className="w-4 h-4" />, label: 'Orders' },
    ];

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/suppliers')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{supplier.companyName}</h1>
                                {supplier.isPreferred && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Provider Matrix • Code: {supplier.supplierCode || 'NO_HASH'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className="rounded-2xl h-12 w-12 p-0 bg-slate-50">
                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </Button>
                        <Button onClick={handleDelete} variant="ghost" className="rounded-2xl h-12 w-12 p-0 bg-red-50 text-red-600 hover:bg-red-100">
                            <Trash2 className="w-5 h-5" />
                        </Button>
                        <div className="h-10 w-px bg-slate-100 mx-2" />
                        <Button onClick={() => navigate(`/suppliers/edit/${id}`)} className="bg-white border border-slate-200 text-slate-900 rounded-[1.2rem] h-14 px-8 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                            <Edit className="w-4 h-4 mr-2" />
                            Modify
                        </Button>
                        <Button onClick={() => setIsAddTxModalOpen(true)} className="bg-black text-white rounded-[1.2rem] h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            <Plus className="w-4 h-4 mr-2" />
                            Inject TX
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                {/* Visual Metadata Index */}
                <div className="flex gap-2 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-white shadow-sm mb-10 w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSearchParams({ tab: tab.key })}
                            className={cn(
                                "flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === tab.key ? "bg-black text-white shadow-xl shadow-black/20" : "text-slate-400 hover:bg-white hover:text-slate-600"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Core Identity Matrix */}
                            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                                <div className="flex items-center justify-between mb-12">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Source Profile Nodes</h3>
                                    <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", supplier.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                        {supplier.status}
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <div className="flex gap-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Direct Dial</p>
                                                <p className="text-base font-black text-slate-900">{supplier.phone || 'NO_HASH'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Electronic Correspondence</p>
                                                <p className="text-base font-black text-slate-900 lowercase">{supplier.email || 'NO_NODE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="flex gap-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Geospatial Sector</p>
                                                <p className="text-sm font-black text-slate-900 uppercase">
                                                    {[supplier.city, supplier.country].filter(Boolean).join(', ') || 'GLOBAL_ZONE'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-amber-500">
                                                <Star className="w-5 h-5 fill-current" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fulfillment Reliability</p>
                                                <div className="flex gap-1 mt-1">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-3 h-3", s <= (supplier.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100")} />)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Exposure Ledger */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                    <div className="p-3 bg-rose-50 rounded-xl w-fit mb-6 text-rose-500">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregated Requisitions</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{fmt(totalPurchased, supplier.currency)}</h3>
                                </div>
                                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-white">
                                    <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-6 text-emerald-500">
                                        <TrendingDown className="w-5 h-5" />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Settled Obligations</p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{fmt(totalPaid, supplier.currency)}</h3>
                                </div>
                                <div className={cn("rounded-[2rem] p-8 shadow-xl border relative overflow-hidden", isOverLimit ? 'bg-rose-900 border-rose-800 text-white shadow-rose-200' : 'bg-black border-black text-white')}>
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Current Liability Exposure</p>
                                        <h3 className="text-2xl font-black tracking-tighter mb-4">{fmt(supplier.currentBalance, supplier.currency)}</h3>

                                        {supplier.creditLimit > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-60">
                                                    <span>Facility Utilization</span>
                                                    <span>{Math.round(creditUtilization)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full transition-all duration-1000", isOverLimit ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400')} style={{ width: `${creditUtilization}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <Wallet className="absolute -right-8 -bottom-8 w-24 h-24 text-white/5 rotate-12" />
                                </div>
                            </div>
                        </div>

                        {/* Organizational Constraints */}
                        <div className="space-y-8">
                            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                                <Zap className="absolute -right-10 -top-10 w-40 h-40 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-8">Internal Directives</h4>
                                    <div className="bg-white/10 rounded-[2rem] p-8 border border-white/10 min-h-[160px]">
                                        <p className="text-xs font-bold leading-relaxed opacity-90 italic">
                                            {supplier.internalNotes || "No restricted directives available for this node."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contractual Parameters</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Facility Limit</span>
                                        <span className="text-xs font-black text-slate-900 font-mono">{fmt(supplier.creditLimit, supplier.currency)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Settlement Days</span>
                                        <span className="text-xs font-black text-slate-900">{paymentTerm?.days || 'PAYMENT_ON_RECEIPT'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tax Identity</span>
                                        <span className="text-xs font-black text-slate-900 font-mono">{supplier.taxNumber || 'NO_REG'}</span>
                                    </div>
                                </div>
                                <hr className="border-slate-50" />
                                <div className="space-y-4">
                                    <div className={cn("p-4 rounded-2xl flex items-center justify-between transition-all", supplier.isPreferred ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-transparent")}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg", supplier.isPreferred ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400")}>
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", supplier.isPreferred ? "text-amber-800" : "text-slate-400")}>Priority Source</span>
                                        </div>
                                        <div className={cn("w-2 h-2 rounded-full", supplier.isPreferred ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-slate-200")} />
                                    </div>
                                    <div className={cn("p-4 rounded-2xl flex items-center justify-between transition-all", supplier.isBlacklisted ? "bg-rose-50 border border-rose-100" : "bg-slate-50 border border-transparent")}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg", supplier.isBlacklisted ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400")}>
                                                <ShieldAlert className="w-3.5 h-3.5" />
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", supplier.isBlacklisted ? "text-rose-800" : "text-slate-400")}>Blacklisted</span>
                                        </div>
                                        <div className={cn("w-2 h-2 rounded-full", supplier.isBlacklisted ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-slate-200")} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ledger' && (
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <div className="flex items-center justify-between mb-16">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                                    <History className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Financial Ledger</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ledger.length} Verified Entries</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-black transition-colors" />
                                    <input
                                        value={txSearch}
                                        onChange={e => setTxSearch(e.target.value)}
                                        placeholder="SCAN ID..."
                                        className="h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-[10px] font-black uppercase focus:ring-2 focus:ring-black w-48 placeholder:text-slate-200"
                                    />
                                </div>
                                <Button onClick={() => setIsAddTxModalOpen(true)} className="bg-black text-white h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10">
                                    Inject Record
                                </Button>
                            </div>
                        </div>

                        {isLoadingLedger ? (
                            <div className="py-24 text-center">
                                <div className="w-12 h-12 border-4 border-slate-100 border-t-black rounded-full animate-spin mx-auto mb-6" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Ledger Nodes...</p>
                            </div>
                        ) : ledger.length > 0 ? (
                            <div className="space-y-4">
                                {ledger.map((row, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-8">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black", row.type === 'payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                                {row.type === 'payment' ? <CheckCircle2 className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-black text-sm uppercase tracking-tight font-mono">{row.referenceId || 'NO_REF'}</h4>
                                                    <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", row.type === 'payment' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                                                        {row.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(row.date).toLocaleDateString()} • {row.description || 'Verified Entry'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12 text-right">
                                            <div>
                                                <p className={cn("text-xl font-black tracking-tighter mb-1", row.type === 'payment' ? 'text-emerald-600' : 'text-rose-600')}>
                                                    {row.type === 'payment' ? '-' : '+'}{fmt(row.amount, supplier.currency)}
                                                </p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.type === 'payment' ? 'Settlement' : 'Requisition'}</p>
                                            </div>
                                            <div className="w-24 px-6 border-l border-slate-100">
                                                <p className="text-xl font-black text-slate-900 tracking-tighter mb-1">{fmt(row.balanceAfter, supplier.currency)}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center opacity-30">
                                <History className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ledger Matrix Vacant</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-10">No historical financial indices found for this provider node.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'purchases' && (
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <div className="flex items-center gap-6 mb-16">
                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-400">
                                <Package className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Procurement Index</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{linkedPurchases.length} Order Records Linked</p>
                            </div>
                        </div>

                        {linkedPurchases.length > 0 ? (
                            <div className="space-y-4">
                                {linkedPurchases.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-8">
                                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-amber-400 transition-all">
                                                <ReceiptText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-tight font-mono mb-1">{p.invoiceNumber}</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(p.date).toLocaleDateString()} • {Array.isArray(p.items) ? `${p.items.length} Production Units` : 'Bulk Order'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-slate-900 tracking-tighter mb-1">{fmt(p.totalAmount, supplier.currency)}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settlement Required</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center opacity-30">
                                <Package className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Order Log Null</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-10">No production acquisitions linked to this identity node.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {isAddTxModalOpen && (
                <AddTransactionModal
                    supplier={supplier}
                    onClose={() => setIsAddTxModalOpen(false)}
                    onSuccess={() => { loadLedger(); setIsAddTxModalOpen(false); }}
                />
            )}
        </div>
    );
}

function AddTransactionModal({ supplier, onClose, onSuccess }: { supplier: Supplier, onClose: () => void, onSuccess: () => void }) {
    const { addSupplierTransaction, activeStoreId } = useERPStore();
    const [formData, setFormData] = useState({
        type: 'purchase' as 'purchase' | 'payment' | 'credit_note',
        amount: '' as string | number,
        referenceId: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(String(formData.amount));
        if (!amount || amount <= 0) return toast.error('PROTOCOL ERROR: Invalid amount index.');

        try {
            const adjustment = formData.type === 'payment' ? -amount : amount;
            const balanceAfter = supplier.currentBalance + adjustment;

            await addSupplierTransaction({
                supplierId: supplier.id,
                storeId: activeStoreId,
                type: formData.type,
                amount,
                balanceAfter,
                date: formData.date,
                referenceId: formData.referenceId,
                description: formData.description
            });

            toast.success('Matrix Reconciled: Transaction Recorded');
            onSuccess();
        } catch {
            toast.error('FAILURE: Transaction synchronization rejected.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
            <div className="bg-white rounded-[4rem] shadow-2xl max-w-xl w-full overflow-hidden border border-white animate-in zoom-in-95 duration-500">
                <form onSubmit={handleSubmit}>
                    <div className="p-12 pb-8 flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Inject Ledger Record</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Adjusting provider exposure matrix</p>
                        </div>
                        <button type="button" onClick={onClose} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="px-12 pb-12 space-y-10">
                        <div className="flex gap-2 p-2 bg-slate-50 rounded-[1.8rem]">
                            {['purchase', 'payment', 'credit_note'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData(f => ({ ...f, type: t as any }))}
                                    className={cn(
                                        "flex-1 py-4 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all",
                                        formData.type === t ? "bg-black text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {t.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Acquisition Magnitude</Label>
                            <div className="relative">
                                <BadgeDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
                                    className="h-20 bg-slate-50 border-none rounded-[1.8rem] pl-16 pr-8 text-3xl font-black focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ref ID / Hash</Label>
                                <Input
                                    placeholder="INV-XXXX"
                                    value={formData.referenceId}
                                    onChange={e => setFormData(f => ({ ...f, referenceId: e.target.value }))}
                                    className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                                    className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-xs font-black focus:ring-2 focus:ring-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-50 flex gap-4 border-t border-slate-100">
                        <Button type="button" onClick={onClose} variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-slate-400">
                            Abort
                        </Button>
                        <Button type="submit" className="flex-1 h-16 rounded-[1.5rem] bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20">
                            Confirm Injection
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
