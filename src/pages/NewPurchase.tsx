import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore } from '@/lib/store-data';
import { Plus, Minus, Trash2, X, Camera, Loader2, ArrowLeft, MoreHorizontal, Zap, ShieldCheck, ShoppingCart, CreditCard, Wallet, Banknote, ListPlus, Box, Search, Package, Save, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function NewPurchase() {
  const navigate = useNavigate();
  const { getStoreProducts, getStoreAccounts, addPurchase, activeStoreId } = useERPStore();

  const products = getStoreProducts();
  const accounts = getStoreAccounts();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [purchaseType, setPurchaseType] = useState<'cash' | 'credit'>('cash');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  const addToCart = (product: typeof products[0]) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.purchasePrice || 0
      }]);
    }
    setShowProductPicker(false);
    setSearchQuery('');
  };

  const handleScanReceipt = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setIsOcrLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const result = await window.electronAPI.processInvoiceOCR(base64, products);

            if (result) {
              if (result.supplier) setSupplier(result.supplier);

              if (result.items && Array.isArray(result.items)) {
                const newItems: CartItem[] = result.items.map(item => ({
                  productId: item.productId || `manual-${Math.random().toString(36).substr(2, 9)}`,
                  productName: item.name,
                  quantity: item.quantity || 1,
                  price: item.price || 0
                }));
                setCart(prev => [...prev, ...newItems]);

                toast.success(`Receipt Captured: ${result.items.length} nodes injected.`);
              }
            }
          } catch (err: unknown) {
            toast.error("AI Capture Failure: Registry rejected receipt payload.");
          } finally {
            setIsOcrLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        setIsOcrLoading(false);
        toast.error("File Buffer Error: Could not read source.");
      }
    };
    fileInput.click();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updatePrice = (productId: string, price: number) => {
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, price } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (cart.length === 0 || !supplier) {
      toast.error("PROTOCOL REJECTED: Vendor node and item indices required.");
      return;
    }

    try {
      await addPurchase({
        supplier,
        type: purchaseType,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount,
        storeId: activeStoreId,
        accountId,
        date: new Date().toISOString()
      });

      toast.success("Purchase Protocol Finalized: Inventory Synchronized");
      navigate('/purchases');
    } catch (error: unknown) {
      toast.error("SYNCHRONIZATION FAILURE: Protocol rejected by registry.");
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
            <button onClick={() => navigate('/purchases')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Procurement Protocol</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Direct Acquisition Node • Hash: 0x{activeStoreId?.substring(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Finalize Protocol
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Acquisition Profile */}
          <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-lg shadow-indigo-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vendor Identification</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Assigning acquisition source node</p>
                </div>
              </div>
              <Button
                onClick={handleScanReceipt}
                disabled={isOcrLoading}
                className="bg-slate-50 hover:bg-slate-100 text-indigo-600 border-none rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                {isOcrLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                AI Capture
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Source Node (Supplier)</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                  placeholder="Enter Source ID..."
                />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Settlement Mode</Label>
                <div className="flex bg-slate-50 p-1 rounded-[1.2rem]">
                  <button
                    onClick={() => setPurchaseType('cash')}
                    className={cn(
                      "flex-1 h-14 rounded-[1rem] flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest transition-all",
                      purchaseType === 'cash' ? "bg-white text-black shadow-sm" : "text-slate-300 hover:text-slate-500"
                    )}
                  >
                    <Wallet className="w-3.5 h-3.5" /> Direct Fund
                  </button>
                  <button
                    onClick={() => setPurchaseType('credit')}
                    className={cn(
                      "flex-1 h-14 rounded-[1rem] flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest transition-all",
                      purchaseType === 'credit' ? "bg-white text-black shadow-sm" : "text-slate-300 hover:text-slate-500"
                    )}
                  >
                    <History className="w-3.5 h-3.5" /> Deferred
                  </button>
                </div>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{cart.length} Unit Nodes Aggregated</p>
                </div>
              </div>
              <Button onClick={() => setShowProductPicker(true)} className="bg-slate-50 hover:bg-slate-100 text-slate-900 border-none rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Button>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] group hover:bg-white hover:shadow-xl transition-all duration-500 border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-8">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-black transition-colors shadow-sm">
                        <Box className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight mb-1">{item.productName}</h4>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Protocol ID: {item.productId.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-12 text-right">
                      <div className="flex items-center bg-white rounded-2xl p-2 border border-slate-100">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-black transition-colors"><Minus className="w-4 h-4" /></button>
                        <span className="w-12 text-center font-black text-sm font-mono">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-black transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="w-32 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-black">$</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-8 pr-4 text-right font-black text-sm font-mono"
                        />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 tracking-tighter mb-1 font-mono">{fmt(item.price * item.quantity)}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Value</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="p-3 bg-white text-slate-200 hover:text-rose-500 rounded-xl transition-all border border-slate-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] opacity-30">
                <ShoppingCart className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Stream Vacant</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-12">Identify product nodes to begin procurement stream injection</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Financial Synthesis */}
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
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Liquidity Provider</Label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full h-16 bg-white/10 border-none rounded-2xl px-6 text-xs font-black uppercase text-white focus:ring-2 focus:ring-white/20 appearance-none"
                  >
                    {accounts.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name.toUpperCase()} ({fmt(a.balance)})</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Protocol</p>
            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl mb-8">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Immutable Record</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Session data is encrypted and validated before registry injection.</p>
          </div>
        </div>
      </main>

      {/* Product Node Identification */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] border border-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-12 pb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Node Identification</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-indigo-600">Selecting product node for infusion</p>
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
                  onClick={() => addToCart(p)}
                  className="w-full p-6 bg-slate-50 hover:bg-white rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-200 group-hover:text-black transition-colors shadow-sm">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm uppercase tracking-tight">{p.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{p.sku} • {p.quantity} {p.unit || 'UNITS'} IN STOCK</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-slate-900 tracking-tighter">{fmt(p.purchasePrice || 0)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
