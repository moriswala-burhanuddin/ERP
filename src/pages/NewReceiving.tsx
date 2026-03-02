import { useState, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore } from '@/lib/store-data';
import { Plus, Minus, Trash2, X, Search, Package, Save, CheckCircle, Info, ArrowLeft, MoreHorizontal, Zap, ZapOff, ShieldCheck, Box, History, AlertCircle, ShoppingCart, CreditCard, Wallet, Banknote, ListPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReceivingCartItem {
    productId: string;
    productName: string;
    cost: number;
    quantity: number;
    discountPct: number;
    total: number;
    batchNumber?: string;
    expiryDate?: string;
    serialNumber?: string;
    location?: string;
    sellingPrice?: number;
}

const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function NewReceiving() {
    const navigate = useNavigate();
    const {
        products,
        accounts,
        suppliers,
        purchaseOrders,
        activeStoreId,
        addReceiving
    } = useERPStore();

    const [supplierId, setSupplierId] = useState('');
    const [poId, setPoId] = useState('');
    const [receivingNumber, setReceivingNumber] = useState(`GRN-${Math.floor(Date.now() / 1000)}`);
    const [notes, setNotes] = useState('');
    const [cart, setCart] = useState<ReceivingCartItem[]>([]);
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const [amountPaid, setAmountPaid] = useState(0);

    const [showProductPicker, setShowProductPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);

    // Modal state for item details
    const [showItemDetails, setShowItemDetails] = useState(false);
    const [editingItem, setEditingItem] = useState<ReceivingCartItem | null>(null);

    const filteredPurchaseOrders = useMemo(() => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return purchaseOrders.filter(po => po.supplier === supplier?.companyName && po.status !== 'received');
    }, [purchaseOrders, supplierId, suppliers]);

    const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

    const handleProductSelect = (product: typeof products[0]) => {
        setSelectedProduct(product);
        setEditingItem({
            productId: product.id,
            productName: product.name,
            cost: product.purchasePrice || 0,
            quantity: 1,
            discountPct: 0,
            total: product.purchasePrice || 0,
            sellingPrice: product.sellingPrice || 0
        });
        setShowProductPicker(false);
        setShowItemDetails(true);
    };

    const saveItemToCart = () => {
        if (!editingItem) return;
        const existingIndex = cart.findIndex(item => item.productId === editingItem.productId);
        if (existingIndex > -1) {
            const newCart = [...cart];
            newCart[existingIndex] = editingItem;
            setCart(newCart);
        } else {
            setCart([...cart, editingItem]);
        }
        setShowItemDetails(false);
        setEditingItem(null);
        setSelectedProduct(null);
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const handleComplete = async () => {
        if (!supplierId || cart.length === 0) {
            toast.error("PROTOCOL REJECTED: Supplier node and item indices required.");
            return;
        }

        try {
            await addReceiving({
                receivingNumber,
                supplierId,
                purchaseOrderId: poId || undefined,
                totalAmount,
                discountTotal: 0,
                amountPaid,
                amountDue: totalAmount - amountPaid,
                accountId: amountPaid > 0 ? accountId : undefined,
                status: 'completed',
                notes,
                storeId: activeStoreId,
                items: cart.map(item => ({ ...item, storeId: activeStoreId }))
            });
            toast.success("Delivery Finalized: Inventory Synchronized");
            navigate('/receivings');
        } catch (error) {
            toast.error("SYNCHRONIZATION FAILURE: Protocol rejected by registry.");
        }
    };

    const handleSuspend = async () => {
        if (!supplierId) {
            toast.error("IDENTIFICATION ERROR: Supplier node required for draft.");
            return;
        }

        try {
            await addReceiving({
                receivingNumber,
                supplierId,
                purchaseOrderId: poId || undefined,
                totalAmount,
                discountTotal: 0,
                amountPaid: 0,
                amountDue: totalAmount,
                status: 'suspended',
                notes,
                storeId: activeStoreId,
                items: cart.map(item => ({ ...item, storeId: activeStoreId }))
            });
            toast.success("Protocol Suspended: Session Saved as Draft");
            navigate('/receivings');
        } catch (error) {
            toast.error("PROTOCOL FAILURE: Session persistence failed.");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-40">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/receivings')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Inbound Protocol</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Acquisition Hash: {receivingNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={handleSuspend} className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] text-slate-400 tracking-widest">
                            Suspend to Draft
                        </Button>
                        <Button onClick={handleComplete} className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Finalize Protocol
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Protocol Environment */}
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-lg shadow-indigo-100">
                                <Box className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Logistics Matrix</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Identifying provider and purchase nodes</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Provider Node (Supplier)</Label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black appearance-none"
                                >
                                    <option value="">Choose Node...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Procurement Reference (PO)</Label>
                                <select
                                    value={poId}
                                    onChange={(e) => setPoId(e.target.value)}
                                    className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black appearance-none disabled:opacity-30"
                                    disabled={!supplierId}
                                >
                                    <option value="">No PO Linked...</option>
                                    {filteredPurchaseOrders.map(po => <option key={po.id} value={po.id}>{po.id.toUpperCase()} ({fmt(po.totalAmount)})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Acquisition Stream */}
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-lg shadow-emerald-100">
                                    <ListPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Acquisition Stream</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{cart.length} Unit Indices Identified</p>
                                </div>
                            </div>
                            <Button onClick={() => setShowProductPicker(true)} className="bg-slate-50 hover:bg-slate-100 text-slate-900 border-none rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest transition-all">
                                <Zap className="w-4 h-4 mr-2" />
                                Initiate Scan
                            </Button>
                        </div>

                        {cart.length > 0 ? (
                            <div className="space-y-4">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-8">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-indigo-600 transition-colors">
                                                <Package className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm uppercase tracking-tight mb-1">{item.productName}</h4>
                                                <div className="flex gap-4">
                                                    {item.batchNumber && (
                                                        <span className="text-[8px] font-black bg-white px-3 py-1 rounded-full text-slate-400 uppercase tracking-widest border border-slate-100">Batch: {item.batchNumber}</span>
                                                    )}
                                                    {item.expiryDate && (
                                                        <span className="text-[8px] font-black bg-rose-50 px-3 py-1 rounded-full text-rose-500 uppercase tracking-widest border border-rose-100">Exp: {item.expiryDate}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-12 text-right">
                                            <div>
                                                <p className="text-xl font-black text-slate-900 tracking-tighter mb-1 font-mono">{item.quantity}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Units Identified</p>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 tracking-tighter mb-1">{fmt(item.total)}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sub-Value</p>
                                            </div>
                                            <button onClick={() => removeFromCart(item.productId)} className="p-3 bg-white text-slate-200 hover:text-rose-500 rounded-xl transition-all border border-slate-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                <ShoppingCart className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Stream Vacant</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Initiate scan or manually add product nodes to begin</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Financial Reconciliation */}
                    <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl shadow-black/20 overflow-hidden relative group">
                        <Zap className="absolute -right-10 -top-10 w-40 h-40 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8">Reconciliation</h4>

                            <div className="space-y-6">
                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Aggregated Value</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{fmt(totalAmount)}</h3>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Settlement Magnitude</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <Input
                                            type="number"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(Number(e.target.value))}
                                            className="h-16 bg-white/10 border-none rounded-2xl pl-16 pr-6 text-xl font-black text-white focus:ring-2 focus:ring-white/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {amountPaid > 0 && (
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Liquidity Source (Account)</Label>
                                        <select
                                            value={accountId}
                                            onChange={(e) => setAccountId(e.target.value)}
                                            className="w-full h-16 bg-white/10 border-none rounded-2xl px-6 text-xs font-black uppercase text-white focus:ring-2 focus:ring-white/20 appearance-none"
                                        >
                                            {accounts.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name.toUpperCase()} ({fmt(a.balance)})</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center gap-3 mb-8 text-indigo-600">
                            <ShieldCheck className="w-5 h-5" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Directives</h3>
                        </div>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-32 bg-slate-50 border-none rounded-2xl p-6 text-xs font-bold leading-relaxed placeholder:text-slate-200 resize-none focus:ring-2 focus:ring-black"
                            placeholder="Add specific delivery directives, damage nodes, or logistics parameters..."
                        />
                    </div>
                </div>
            </main>

            {/* Product Picker Protocol */}
            {showProductPicker && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[4rem] border border-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-12 pb-8 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Node Identification</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-indigo-600">Selecting product node for stream injection</p>
                            </div>
                            <button onClick={() => setShowProductPicker(false)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <div className="px-12 pb-8">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-black transition-colors" />
                                <Input
                                    placeholder="SCAN ID OR NAME..."
                                    className="h-16 bg-slate-50 border-none rounded-[1.5rem] pl-16 pr-6 text-sm font-black uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto px-12 pb-12 space-y-3">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleProductSelect(p)}
                                    className="w-full p-6 bg-slate-50 hover:bg-white rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-xl transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200 group-hover:text-black transition-colors">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm uppercase tracking-tight">{p.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.sku} • {p.quantity} {p.unit || 'UNITS'} IN SECTOR</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-black text-slate-900 tracking-tighter">{fmt(p.purchasePrice || 0)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Item Details Synthesis */}
            {showItemDetails && editingItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[4rem] border border-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
                        <div className="p-12 pb-8 bg-indigo-600 text-white flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Stream Synthesis</h3>
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-2">{editingItem.productName}</p>
                            </div>
                            <button onClick={() => setShowItemDetails(false)} className="p-4 bg-white/10 hover:bg-white/20 rounded-3xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-12 space-y-10">
                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Magnitude (Qty)</Label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setEditingItem({ ...editingItem, quantity: Math.max(1, editingItem.quantity - 1), total: Math.max(1, editingItem.quantity - 1) * editingItem.cost })} className="w-16 h-16 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Minus /></button>
                                        <input type="number" value={editingItem.quantity} className="flex-1 h-16 bg-slate-50 border-none rounded-2xl text-center font-black text-xl" onChange={e => {
                                            const q = Number(e.target.value);
                                            setEditingItem({ ...editingItem, quantity: q, total: q * editingItem.cost });
                                        }} />
                                        <button onClick={() => setEditingItem({ ...editingItem, quantity: editingItem.quantity + 1, total: (editingItem.quantity + 1) * editingItem.cost })} className="w-16 h-16 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Plus /></button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Acquisition Cost</Label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                                        <Input type="number" value={editingItem.cost} className="h-16 bg-slate-50 border-none rounded-2xl pl-16 pr-6 text-xl font-black" onChange={e => {
                                            const c = Number(e.target.value);
                                            setEditingItem({ ...editingItem, cost: c, total: editingItem.quantity * c });
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Registry Hash (Batch #)</Label>
                                    <Input placeholder="B-XXXX" className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-black uppercase" value={editingItem.batchNumber || ''} onChange={e => setEditingItem({ ...editingItem, batchNumber: e.target.value })} />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Extinction Threshold (Expiry)</Label>
                                    <Input type="date" className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-xs font-black" value={editingItem.expiryDate || ''} onChange={e => setEditingItem({ ...editingItem, expiryDate: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-slate-50 flex gap-4 border-t border-slate-100">
                            <Button onClick={() => setShowItemDetails(false)} variant="ghost" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-slate-400">Abort</Button>
                            <Button onClick={saveItemToCart} className="flex-1 h-16 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-200">Inject to Stream</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
