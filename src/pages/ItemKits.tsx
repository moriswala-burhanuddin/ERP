import { useState } from 'react';
import { useERPStore, ItemKit } from '@/lib/store-data';
import { Plus, Search, Package, Trash2, Edit2, ChevronRight, X, Layers, LayoutGrid, Box, Zap, MoreHorizontal, ArrowLeft, ArrowRight, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ItemKits() {
    const { itemKits, products, addItemKit, updateItemKit, deleteItemKit, activeStoreId } = useERPStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingKit, setEditingKit] = useState<ItemKit | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [sellingPrice, setSellingPrice] = useState(0);
    const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);

    const filteredKits = itemKits.filter(kit =>
        kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kit.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddItem = (productId: string) => {
        if (selectedItems.find(i => i.productId === productId)) return;
        setSelectedItems([...selectedItems, { productId, quantity: 1 }]);
    };

    const handleRemoveItem = (productId: string) => {
        setSelectedItems(selectedItems.filter(i => i.productId !== productId));
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        setSelectedItems(selectedItems.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i));
    };

    const resetForm = () => {
        setName('');
        setSku('');
        setCategory('');
        setSellingPrice(0);
        setSelectedItems([]);
        setEditingKit(null);
    };

    const handleSubmit = async () => {
        if (!name || !sku || selectedItems.length === 0) {
            toast.error('Please fill in all required fields and add at least one product.');
            return;
        }

        const kitData = {
            name,
            sku,
            category,
            sellingPrice,
            storeId: activeStoreId,
            isActive: true,
            items: selectedItems,
            updatedAt: new Date().toISOString()
        };

        try {
            if (editingKit) {
                await updateItemKit(editingKit.id, kitData);
                toast.success('Item Kit Updated.');
            } else {
                await addItemKit(kitData);
                toast.success('Item Kit Created.');
            }
            setIsAddOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Failed to save item kit.');
        }
    };

    const handleEdit = (kit: ItemKit) => {
        setEditingKit(kit);
        setName(kit.name);
        setSku(kit.sku);
        setCategory(kit.category || '');
        setSellingPrice(kit.sellingPrice);
        setSelectedItems(kit.items || []);
        setIsAddOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this item kit?')) return;
        try {
            await deleteItemKit(id);
            toast.success('Item Kit Deleted.');
        } catch (error) {
            toast.error('Failed to delete item kit.');
        }
    };

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
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Item Kits</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">All Bundles • {itemKits.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if (!val) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="bg-black text-white rounded-[1.2rem] h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    <Plus className="w-4 h-4 mr-2 text-indigo-400" />
                                    Add New Kit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[3rem] p-12 max-w-2xl border-none shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-none">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Bundle Details</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Add a name, SKU, and choose which products to include.</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-8 py-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Bundle Name</Label>
                                            <Input value={name} onChange={e => setName(e.target.value)} className="h-16 bg-slate-50 border-none rounded-[1.2rem] px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black" placeholder="Winter Bundle" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">SKU Code</Label>
                                            <Input value={sku} onChange={e => setSku(e.target.value)} className="h-16 bg-slate-50 border-none rounded-[1.2rem] px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black font-mono" placeholder="BX-001" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Category</Label>
                                            <Input value={category} onChange={e => setCategory(e.target.value)} className="h-16 bg-slate-50 border-none rounded-[1.2rem] px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black" placeholder="BUNDLES" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Selling Price</Label>
                                            <Input type="number" value={sellingPrice} onChange={e => setSellingPrice(Number(e.target.value))} className="h-16 bg-slate-50 border-none rounded-[1.2rem] px-6 text-xl font-black focus:ring-2 focus:ring-black" />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 mb-6 flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-indigo-500" />
                                            Products in Bundle
                                        </h4>

                                        <div className="space-y-4 min-h-[100px] mb-8">
                                            {selectedItems.map((item, idx) => {
                                                const product = products.find(p => p.id === item.productId);
                                                return (
                                                    <div key={idx} className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group/item">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200">
                                                                <Box className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase text-slate-900 leading-none mb-1">{product?.name || 'Product Missing'}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product?.sku}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex items-center bg-white rounded-xl border border-slate-100 overflow-hidden">
                                                                <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-black">-</button>
                                                                <span className="w-12 h-10 flex items-center justify-center text-xs font-black">{item.quantity}</span>
                                                                <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-black">+</button>
                                                            </div>
                                                            <button onClick={() => handleRemoveItem(item.productId)} className="p-3 bg-white text-rose-300 hover:text-rose-500 rounded-xl border border-rose-50 transition-all opacity-0 group-hover/item:opacity-100">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedItems.length === 0 && (
                                                <div className="py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                                                    <Layers className="w-12 h-12 mb-4 opacity-20" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Add products below...</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative group">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-black transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="SEARCH PRODUCTS TO ADD..."
                                                className="w-full h-16 bg-slate-50 border-none rounded-[1.2rem] pl-16 pr-8 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black"
                                                onChange={(e) => {
                                                    // Filter logic...
                                                }}
                                            />
                                        </div>
                                        <div className="mt-4 max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-none">
                                            {products.filter(p => !selectedItems.find(si => si.productId === p.id)).slice(0, 10).map(product => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleAddItem(product.id)}
                                                    className="w-full text-left p-6 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center transition-all group/node"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-200 group-hover/node:text-indigo-400 group-hover/node:bg-indigo-50 transition-all">
                                                            <Box className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">{product.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.sku}</p>
                                                        </div>
                                                    </div>
                                                    <Plus className="w-4 h-4 text-slate-300 group-hover/node:text-black transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="gap-4">
                                    <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="h-16 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest text-slate-400">Cancel</Button>
                                    <Button onClick={handleSubmit} className="h-16 rounded-[1.2rem] bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20 px-12">
                                        {editingKit ? 'Update Kit' : 'Create Bundle'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-10">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white flex flex-col justify-center">
                        <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-8 text-indigo-500">
                            <Layers className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Kits</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{itemKits.length}</h3>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white flex flex-col justify-center">
                        <div className="p-4 bg-emerald-50 rounded-2xl w-fit mb-8 text-emerald-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(itemKits.reduce((sum, k) => sum + (k.sellingPrice || 0), 0))}</h3>
                    </div>

                    <div className="bg-black rounded-[2.5rem] p-10 text-white shadow-2xl shadow-black/20 flex flex-col justify-center relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl text-indigo-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">All Good</span>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-6 rounded-[3rem] border border-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1 relative group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH KITS BY NAME OR SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 bg-slate-50 border-none rounded-[1.5rem] pl-16 pr-8 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black placeholder:text-slate-200 transition-all"
                        />
                    </div>
                </div>

                {/* Kit Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredKits.length > 0 ? (
                        filteredKits.map((kit) => (
                            <div
                                key={kit.id}
                                onClick={() => handleEdit(kit)}
                                className="bg-white rounded-[3rem] p-10 border-2 border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group cursor-pointer relative flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-black group-hover:text-white transition-all shadow-inner relative overflow-hidden">
                                        <Layers className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => handleDelete(kit.id, e)} className="p-4 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0 mb-10">
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors mb-2 truncate">{kit.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">#{kit.sku}</span>
                                        <span className="opacity-50">/</span>
                                        {kit.category || 'GENERAL'}
                                    </p>

                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-widest shadow-sm">
                                            {kit.items?.length || 0} PRODUCTS
                                        </Badge>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-50 flex items-end justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 opacity-50">Bundle Price</p>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(kit.sellingPrice || 0)}</h3>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-all">
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-60 text-center opacity-30 flex flex-col items-center justify-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
                            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-10">
                                <LayoutGrid className="w-16 h-16 text-slate-100" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">No Kits Found</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4 px-20 max-w-2xl leading-loose text-center">No item kits found. Create a new bundle to get started.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
