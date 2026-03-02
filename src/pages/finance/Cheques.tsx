import React, { useState, useEffect } from 'react';
import {
    Search, Plus, CheckCircle2, XCircle, AlertCircle, Clock,
    Building2, Calendar, Wallet, ArrowUpRight, ArrowDownLeft,
    MoreVertical, ArrowLeft, FileCheck, Ghost, X
} from 'lucide-react';
import { useERPStore, Cheque } from '../../lib/store-data';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Cheques = () => {
    const { cheques, fetchCheques, addCheque, updateChequeStatus, deleteCheque } = useERPStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Cheque['status']>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'supplier' | 'customer'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCheque, setNewCheque] = useState<Omit<Cheque, 'id' | 'updatedAt' | 'storeId' | 'status'>>({
        partyType: 'customer', partyId: '', partyName: '', chequeNumber: '', bankName: '', amount: 0,
        issueDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => { fetchCheques(); }, [fetchCheques]);

    const handleAddCheque = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addCheque(newCheque);
            setShowAddModal(false);
            setNewCheque({ partyType: 'customer', partyId: '', partyName: '', chequeNumber: '', bankName: '', amount: 0, issueDate: new Date().toISOString().split('T')[0] });
            toast.success('Monetary Instrument Logged: Cheque node synchronized.');
        } catch { toast.error('Protocol Error: Cheque registration failed.'); }
    };

    const filteredCheques = cheques.filter(chq => {
        const matchesSearch = chq.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chq.chequeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chq.bankName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || chq.status === statusFilter;
        const matchesType = typeFilter === 'all' || chq.partyType === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
        pending: { label: 'Pending', class: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock className="w-3.5 h-3.5" /> },
        cleared: { label: 'Cleared', class: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
        bounced: { label: 'Bounced', class: 'bg-rose-50 text-rose-600 border-rose-100', icon: <AlertCircle className="w-3.5 h-3.5" /> },
        cancelled: { label: 'Cancelled', class: 'bg-slate-50 text-slate-500 border-slate-100', icon: <XCircle className="w-3.5 h-3.5" /> },
    };

    const totalPending = cheques.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
    const totalCleared = cheques.filter(c => c.status === 'cleared').reduce((s, c) => s + c.amount, 0);
    const totalBounced = cheques.filter(c => c.status === 'bounced').reduce((s, c) => s + c.amount, 0);
    const totalAll = cheques.reduce((s, c) => s + c.amount, 0);

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => window.history.back()} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Monetary Instrument Ledger</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                                Cheque Clearance Command • {cheques.length} Instrument Nodes
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-3">
                        <Plus className="w-4 h-4 text-indigo-400" />
                        Register Instrument
                    </Button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-10">
                {/* Intelligence Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Portfolio', amount: totalAll, color: 'bg-indigo-50 text-indigo-500', icon: <Wallet className="w-5 h-5" /> },
                        { label: 'Pending Clearance', amount: totalPending, color: 'bg-amber-50 text-amber-500', icon: <Clock className="w-5 h-5" /> },
                        { label: 'Cleared Instruments', amount: totalCleared, color: 'bg-emerald-50 text-emerald-500', icon: <CheckCircle2 className="w-5 h-5" /> },
                        { label: 'Dishonored Orders', amount: totalBounced, color: 'bg-rose-50 text-rose-500', icon: <AlertCircle className="w-5 h-5" /> },
                    ].map(item => (
                        <div key={item.label} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white">
                            <div className={cn("p-3 rounded-xl w-fit mb-6", item.color)}>
                                {item.icon}
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">₹{item.amount.toLocaleString()}</h3>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[2rem] p-6 border border-white shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative group flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="SCAN INSTRUMENT..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 text-[10px] font-black uppercase focus:ring-2 focus:ring-black w-full placeholder:text-slate-200"
                        />
                    </div>
                    <div className="flex gap-3">
                        {(['all', 'pending', 'cleared', 'bounced', 'cancelled'] as const).map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={cn("px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    statusFilter === s ? "bg-black text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}
                            >{s}</button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {[{ v: 'all', l: 'ALL' }, { v: 'customer', l: 'INCOMING' }, { v: 'supplier', l: 'OUTGOING' }].map(t => (
                            <button key={t.v} onClick={() => setTypeFilter(t.v as any)}
                                className={cn("px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                    typeFilter === t.v ? "bg-black text-white" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}
                            >{t.l}</button>
                        ))}
                    </div>
                </div>

                {/* Cheque Cards */}
                <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-white min-h-[400px]">
                    {filteredCheques.length > 0 ? (
                        <div className="space-y-4">
                            {filteredCheques.map(chq => {
                                const sc = statusConfig[chq.status];
                                const isIncoming = chq.partyType === 'customer';
                                return (
                                    <div key={chq.id} className="bg-slate-50 hover:bg-white p-8 rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-8 flex-1">
                                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0", isIncoming ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500')}>
                                                {isIncoming ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={cn("px-4 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5", sc.class)}>
                                                        {sc.icon} {sc.label}
                                                    </span>
                                                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", isIncoming ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                                        {isIncoming ? 'Incoming' : 'Outgoing'}
                                                    </span>
                                                </div>
                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">{chq.partyName}</h4>
                                                <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{chq.bankName}</span>
                                                    <span className="font-mono">#{chq.chequeNumber}</span>
                                                    <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />{format(new Date(chq.issueDate), 'dd MMM yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{chq.amount.toLocaleString()}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instrument Amount</p>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                {chq.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => { updateChequeStatus(chq.id, 'cleared', new Date().toISOString()); toast.success("Cheque Cleared: Instrument fully authorized."); }}
                                                            className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => { updateChequeStatus(chq.id, 'bounced'); toast.error("Cheque Bounced: Instrument dishonored."); }}
                                                            className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all">
                                                            <AlertCircle className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => { if (confirm('Purge this instrument record?')) { deleteCheque(chq.id); toast.success('Instrument node purged.'); } }}
                                                    className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-32 text-center opacity-30 flex flex-col items-center">
                            <Ghost className="w-24 h-24 text-slate-100 mb-8" />
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ledger Vacant</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 max-w-lg mx-auto leading-relaxed">No monetary instruments found. Register a cheque to populate the ledger.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Cheque Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
                    <div className="bg-white rounded-[4rem] shadow-2xl max-w-xl w-full overflow-hidden border border-white animate-in zoom-in-95 duration-500">
                        <form onSubmit={handleAddCheque}>
                            <div className="p-12 pb-8 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Register Instrument</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Log a new monetary instrument node</p>
                                </div>
                                <button type="button" onClick={() => setShowAddModal(false)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="px-12 pb-12 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Party Identification</label>
                                    <input type="text" required value={newCheque.partyName} onChange={e => setNewCheque({ ...newCheque, partyName: e.target.value })} placeholder="SUPPLIER_OR_CUSTOMER_NAME" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direction Protocol</label>
                                        <select value={newCheque.partyType} onChange={e => setNewCheque({ ...newCheque, partyType: e.target.value as any })} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black outline-none">
                                            <option value="customer">INCOMING_CUSTOMER</option>
                                            <option value="supplier">OUTGOING_SUPPLIER</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instrument Hash</label>
                                        <input type="text" required value={newCheque.chequeNumber} onChange={e => setNewCheque({ ...newCheque, chequeNumber: e.target.value })} placeholder="123456" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black font-mono focus:ring-2 focus:ring-black outline-none placeholder:text-slate-200" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banking Node</label>
                                        <input type="text" required value={newCheque.bankName} onChange={e => setNewCheque({ ...newCheque, bankName: e.target.value })} placeholder="HDFC_BANK" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black outline-none placeholder:text-slate-200" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Face Value (₹)</label>
                                        <input type="number" required value={newCheque.amount} onChange={e => setNewCheque({ ...newCheque, amount: Number(e.target.value) })} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-xl font-black focus:ring-2 focus:ring-black outline-none" />
                                    </div>
                                    <div className="space-y-3 col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Date</label>
                                        <input type="date" required value={newCheque.issueDate} onChange={e => setNewCheque({ ...newCheque, issueDate: e.target.value })} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black focus:ring-2 focus:ring-black outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 bg-slate-50 flex gap-4 border-t border-slate-100">
                                <Button type="button" onClick={() => setShowAddModal(false)} variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-slate-400">Abort</Button>
                                <Button type="submit" className="flex-1 h-16 rounded-[1.5rem] bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20">Log Instrument</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cheques;
