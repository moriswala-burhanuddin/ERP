import { useStoreConfig } from '@/lib/store-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, RefreshCcw, ShieldCheck, UserCheck, Receipt, Hash, AlertTriangle, Ghost, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ReturnsTab() {
    const {
        returnReasons, requireCustomerForReturn, requireReceiptForReturn, promptForSaleIdOnReturn,
        updateConfig
    } = useStoreConfig();

    const [newReason, setNewReason] = useState('');

    return (
        <div className="space-y-12">
            {/* Sector 1: Reversal Protocols */}
            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-500 rounded-xl text-white">
                            <RefreshCcw className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Reversal Protocols</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Policy-level constraints governing the return of assets, including verification requirements and mandatory data hooks.</p>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { id: 'requireCustomerForReturn', label: 'Identity Verification', sub: 'Require customer node for return', icon: <UserCheck className="w-4 h-4" />, state: requireCustomerForReturn, action: (v: boolean) => updateConfig({ requireCustomerForReturn: v }) },
                            { id: 'requireReceiptForReturn', label: 'Voucher Verification', sub: 'Require fiscal receipt for return', icon: <Receipt className="w-4 h-4" />, state: requireReceiptForReturn, action: (v: boolean) => updateConfig({ requireReceiptForReturn: v }) },
                            { id: 'promptForSaleIdOnReturn', label: 'Transaction Hook', sub: 'Prompt for Sale ID identifier', icon: <Hash className="w-4 h-4" />, state: promptForSaleIdOnReturn, action: (v: boolean) => updateConfig({ promptForSaleIdOnReturn: v }) },
                        ].map((item) => (
                            <div key={item.id} className="bg-slate-50 p-6 rounded-[1.8rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        item.state ? "bg-black text-white" : "bg-white text-slate-300 group-hover:text-black")}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight">{item.label}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.sub}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={item.state}
                                    onCheckedChange={item.action}
                                    className="data-[state=checked]:bg-black"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center gap-6">
                        <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-[9px] font-bold text-indigo-900 uppercase tracking-widest leading-relaxed">These protocols are enforced globally across all terminal nodes to ensure fiscal integrity during asset reversal events.</p>
                    </div>
                </div>
            </div>

            {/* Sector 2: Anomaly Taxonomy */}
            <div className="pt-12 border-t border-slate-100 grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-black rounded-xl text-white">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Anomaly Taxonomy</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Classification of return triggers used for analytics and inventory optimization protocols.</p>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="flex gap-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 items-center justify-between">
                        <div className="relative flex-1 group">
                            <Plus className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-black transition-colors" />
                            <Input
                                placeholder="INITIALIZE ANOMALY REASON (E.G. TRANSIT_DAMAGE)"
                                value={newReason}
                                onChange={e => setNewReason(e.target.value)}
                                className="h-14 bg-white border-none rounded-2xl pl-14 pr-8 text-[11px] font-black uppercase"
                            />
                        </div>
                        <Button
                            className="h-14 px-10 rounded-2xl bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20"
                            onClick={() => {
                                if (newReason && !returnReasons.includes(newReason)) {
                                    updateConfig({ returnReasons: [...returnReasons, newReason] });
                                    setNewReason('');
                                    toast.success("Anomaly Vector Authorized");
                                }
                            }}
                        >
                            Authorize
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {returnReasons.map(reason => (
                            <div key={reason} className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-black transition-all">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest shrink-0">{reason}</span>
                                <button
                                    onClick={() => {
                                        updateConfig({ returnReasons: returnReasons.filter(r => r !== reason) });
                                        toast.info("Anomaly Vector Dissolved");
                                    }}
                                    className="p-2 bg-slate-50 rounded-lg text-slate-200 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        {returnReasons.length === 0 && (
                            <div className="py-20 text-center opacity-30 flex flex-col items-center w-full">
                                <Ghost className="w-16 h-16 text-slate-100 mb-6" />
                                <h4 className="text-xl font-black text-slate-900 uppercase">Reason Vacuum</h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-2 px-20 text-center">No return reasons classified. Taxonomy is currently dormant.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
