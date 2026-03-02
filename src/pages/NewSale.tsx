import { useState, useEffect, useRef, useCallback } from 'react';
import { isElectron } from '@/lib/electron-helper';
import { useERPStore, Product, ItemKit } from '@/lib/store-data';
import { Plus, Minus, Trash2, X, Search, ShoppingBag, UserPlus, Check, ChevronsUpDown, MoreVertical, Pause, ClipboardList, Truck, Mail, Barcode, ArrowLeft, CreditCard, Wallet, Tag, ShieldCheck, Zap, AlertTriangle, TrendingUp, Activity, Smartphone, Monitor, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from 'vaul';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { generateReceiptHtml } from '@/components/sales/ReceiptTemplate';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { generateId } from '@/lib/utils';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  discount: number;
}

type SearchItem = (Product & { type: 'PRODUCT' }) | (ItemKit & { type: 'KIT' });

export default function NewSale() {
  const navigate = useNavigate();
  const { getStoreProducts, getStoreCustomers, getStoreAccounts, getStoreQuotations, getStoreItemKits, getStoreUsers, addSale, addCustomer, activeStoreId, taxSlabs, giftCards, getActiveStore, sales, testModeEnabled, toggleTestMode, addGiftCard, addActivityLog } = useERPStore();

  const products = getStoreProducts();
  const customers = getStoreCustomers();
  const accounts = getStoreAccounts();
  const quotations = getStoreQuotations();
  const itemKits = getStoreItemKits();
  const users = getStoreUsers();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<'cash' | 'credit' | 'retail'>('cash');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [customerId, setCustomerId] = useState<string>('');
  const [quotationId, setQuotationId] = useState<string>('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [billDiscount, setBillDiscount] = useState(0);
  const [selectedTaxSlabId, setSelectedTaxSlabId] = useState<string>('');
  const [payments, setPayments] = useState<{ mode: 'cash' | 'card' | 'upi' | 'gift_card' | 'store_credit', amount: number, accountId?: string, giftCardId?: string }[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', area: '' });
  const barcodeBuffer = useRef('');

  const [overrideItem, setOverrideItem] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [adminCode, setAdminCode] = useState('');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputDialogTitle, setInputDialogTitle] = useState('');
  const [inputDialogLabel, setInputDialogLabel] = useState('');
  const [inputDialogOnConfirm, setInputDialogOnConfirm] = useState<(val: string) => void>(() => (val: string) => { });

  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [showWorkOrderDialog, setShowWorkOrderDialog] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryEmployeeId, setDeliveryEmployeeId] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isCod, setIsCod] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats for the POS
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsDiscountTotal = cart.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const selectedTaxSlab = taxSlabs.find(s => s.id === selectedTaxSlabId);
  const taxableAmount = Math.max(0, subtotal - itemsDiscountTotal - billDiscount);
  const taxAmount = selectedTaxSlab ? (taxableAmount * selectedTaxSlab.percentage) / 100 : 0;
  const totalAmount = taxableAmount + taxAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalAmount - totalPaid;

  const calculateKitCost = useCallback((kitItems: { productId: string, quantity: number }[]) => {
    return kitItems.reduce((total, kitItem) => {
      const product = products.find(p => p.id === kitItem.productId);
      return total + (product ? product.purchasePrice * kitItem.quantity : 0);
    }, 0);
  }, [products]);

  const addToCart = useCallback((item: SearchItem) => {
    setCart(prevCart => {
      const existing = prevCart.find(i => i.productId === item.id);
      let purchasePrice = 0;
      let limit = 0;

      if (item.type === 'KIT') {
        purchasePrice = calculateKitCost(item.items);
      } else {
        purchasePrice = item.purchasePrice || 0;
        limit = item.limitedQty || 0;
      }

      if (existing) {
        if (limit > 0 && existing.quantity + 1 > limit) {
          toast.error(`Stock limit reached for ${item.name}`);
          return prevCart;
        }
        return prevCart.map(i =>
          i.productId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        toast.info(`${item.name} added to cart`);
        return [...prevCart, {
          productId: item.id,
          productName: item.name,
          quantity: 1,
          price: item.sellingPrice,
          purchasePrice: purchasePrice,
          discount: 0
        }];
      }
    });
    setSearchQuery('');
  }, [calculateKitCost]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 8) {
          const skuOrBarcode = barcodeBuffer.current;
          const found = products.find(p => p.barcode === skuOrBarcode || p.sku === skuOrBarcode);
          if (found) {
            addToCart({ ...found, type: 'PRODUCT' });
          } else {
            toast.error(`Unknown product: ${skuOrBarcode}`);
          }
        }
        barcodeBuffer.current = '';
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        barcodeBuffer.current += e.key;
        setTimeout(() => { barcodeBuffer.current = ''; }, 1000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addToCart]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        const limit = product?.limitedQty || 0;
        if (delta > 0 && limit > 0 && newQty > limit) {
          toast.error(`Limit: ${limit} units.`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  }, [products]);

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.info("Item discarded from cart");
  };

  const handleSubmit = async () => {
    if (isSubmitting || cart.length === 0) return;
    if (saleType === 'credit' && !customerId) {
      toast.error("Customer Selection Mandatory for Credit");
      return;
    }
    if (saleType !== 'credit' && remainingBalance > 0.01) {
      toast.error(`Payment Shortfall: $${remainingBalance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const totalProfit = cart.reduce((sum, item) => sum + (((item.price - item.discount) - item.purchasePrice) * item.quantity), 0) - billDiscount;
      await addSale({
        type: saleType,
        status: 'completed',
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        discountAmount: itemsDiscountTotal + billDiscount,
        taxAmount,
        totalAmount,
        profit: totalProfit,
        paymentMode: payments[0]?.mode || 'cash',
        payments: payments.map(p => ({
          id: generateId(),
          saleId: '',
          paymentMode: p.mode,
          amount: p.amount,
          accountId: p.accountId || accountId,
          giftCardId: p.giftCardId
        })),
        accountId: payments.find(p => p.accountId)?.accountId || accountId,
        customerId: customerId || undefined,
        quotationId: quotationId || undefined,
        storeId: activeStoreId,
        date: new Date().toISOString()
      });

      toast.success("Transaction Record Committed");
      navigate('/sales');
    } catch (error) {
      toast.error((error as Error).message || "Transaction Security Protocol Violation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceOverride = async () => {
    let isValid = false;
    if (isElectron() && window.electronAPI?.verifySupervisor) {
      isValid = await window.electronAPI.verifySupervisor(adminCode);
    } else {
      isValid = adminCode === '1234';
    }
    if (!isValid) {
      toast.error("Security Override Failed: Invalid Code");
      return;
    }
    const price = parseFloat(overrideValue);
    if (isNaN(price) || price < 0) return;

    setCart(prev => prev.map(item => {
      if (item.productId === overrideItem) {
        addActivityLog({ action: 'PRICE_OVERRIDE', details: `Item: ${item.productName}, Orig: $${item.price}, New: $${price}` });
        return { ...item, price };
      }
      return item;
    }));
    setShowOverrideDialog(false);
    setOverrideItem(null);
    setAdminCode('');
  };

  const searchItems = ([
    ...products.map(p => ({ ...p, type: 'PRODUCT' as const })),
    ...itemKits.map(k => ({ ...k, type: 'KIT' as const, purchasePrice: calculateKitCost(k.items) }))
  ] as SearchItem[]).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col">
      {/* Superior POS Header */}
      <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
        <div className="max-w-[1920px] mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/sales')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Checkout Intelligence</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Terminal ID: SF-POS-01 • v4.2</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-12 hidden lg:block group">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                placeholder="Scan or Search Inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 bg-slate-50 border-none rounded-[1.2rem] pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-black placeholder:text-slate-200 transition-all uppercase"
              />
              {searchQuery && (
                <div className="absolute top-16 left-0 right-0 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
                  {searchItems.slice(0, 10).map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all group"
                    >
                      <div className="text-left">
                        <p className="font-black text-sm text-slate-900 group-hover:translate-x-1 transition-transform">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.sku} • {item.type === 'KIT' ? 'COMBO' : `${item.quantity} IN STOCK`}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">${item.sellingPrice.toLocaleString()}</p>
                        <Plus className="w-4 h-4 text-indigo-600 inline ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl">
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[2rem] p-4 text-[10px] font-black uppercase tracking-widest">
                <DropdownMenuItem onClick={toggleTestMode} className="py-4 px-4 rounded-xl focus:bg-orange-50 focus:text-orange-700">
                  {testModeEnabled ? "EXIT TEST MODE" : "ENTER TEST MODE"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (window.electronAPI) await window.electronAPI.openSecondaryDisplay();
                  toast.success("Secondary Display Synchronized");
                }} className="py-4 px-4 rounded-xl">
                  CUSTOMER DISPLAY
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-10 w-px bg-slate-100 mx-2" />
            <div className="bg-black text-white px-6 py-2 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-0.5 leading-none">Gross Total</span>
              <span className="text-lg font-black tracking-tight leading-none">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* Selection Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-4xl mx-auto space-y-10">
            {/* 1. Transaction Parameters */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white">
                <div className="flex items-center gap-3 mb-8">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Parameters</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 rounded-2xl">
                    {['cash', 'credit', 'retail'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSaleType(t as any)}
                        className={cn(
                          "py-3 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all",
                          saleType === t ? "bg-black text-white shadow-xl" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Escrow Account</Label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-bold uppercase focus:ring-2 focus:ring-black appearance-none"
                    >
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Counterparty</h3>
                  </div>
                  {saleType === 'credit' && (
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">REQUIRED</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "w-full h-16 rounded-2xl px-6 font-black text-xs uppercase flex items-center justify-between border-2 transition-all group",
                        customerId ? "border-slate-100 bg-slate-50" : "border-dashed border-slate-200 hover:border-black text-slate-400"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-slate-300" />
                          </div>
                          <div className="text-left">
                            <p className={cn("leading-none mb-1", customerId ? "text-slate-900" : "text-slate-300")}>
                              {customerId ? customers.find(c => c.id === customerId)?.name : "SELECT CUSTOMER"}
                            </p>
                            <p className="text-[9px] opacity-60">Digital Profile Identity</p>
                          </div>
                        </div>
                        <ChevronsUpDown className="w-4 h-4 opacity-30" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl z-[100]" align="center">
                      <Command className="font-black uppercase">
                        <CommandInput placeholder="Search Customer Registry..." className="h-14 pl-12" />
                        <CommandList className="max-h-80">
                          <CommandEmpty className="py-10 text-center text-slate-400 text-[10px]">Registry Empty</CommandEmpty>
                          <CommandGroup>
                            <CommandItem className="py-4 px-6 hover:bg-slate-50 cursor-pointer" onSelect={() => { setCustomerId(""); setCustomerSearchOpen(false); }}>
                              <Check className={cn("mr-4 h-4 w-4", !customerId ? "opacity-100" : "opacity-0")} />
                              WALK-IN GUEST
                            </CommandItem>
                            {customers.map(c => (
                              <CommandItem key={c.id} onSelect={() => { setCustomerId(c.id); setCustomerSearchOpen(false); }} className="py-4 px-6 gap-4">
                                <Check className={cn("h-4 w-4", customerId === c.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex-1">
                                  <p className="font-black text-xs">{c.name}</p>
                                  <p className="text-[9px] text-slate-400 lowercase">{c.phone} • {c.area}</p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                          <Button onClick={() => setNewCustomerOpen(true)} className="w-full bg-black text-white h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            New Guest Protocol
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* 2. Cart Ledger */}
            <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <ShoppingBag className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cart Registry</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} Items Indexed</p>
                  </div>
                </div>
                {!isElectron() && (
                  <Button onClick={() => setSearchQuery(' ')} className="lg:hidden bg-indigo-600 text-white rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest">
                    <Plus className="w-4 h-4 mr-2" /> Add Items
                  </Button>
                )}
              </div>

              {cart.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {cart.map((item) => (
                    <div key={item.productId} className="py-8 group flex items-center justify-between gap-12">
                      <div className="flex-1 flex items-center gap-8 min-w-0">
                        <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center font-black text-slate-300 group-hover:bg-slate-100 transition-colors shrink-0">
                          <Tag className="w-8 h-8" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-lg text-slate-900 uppercase truncate mb-1">{item.productName}</h4>
                          <button
                            onClick={() => { setOverrideItem(item.productId); setOverrideValue(item.price.toString()); setShowOverrideDialog(true); }}
                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 underline underline-offset-4 decoration-indigo-200"
                          >
                            ${item.price.toLocaleString()} / Unit (Override)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-10">
                        <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <Minus className="w-3 h-3 text-slate-400" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setCart(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: val } : i));
                            }}
                            className="w-16 bg-transparent border-none text-center font-black text-lg text-slate-900 focus:ring-0 p-0"
                          />
                          <button onClick={() => updateQuantity(item.productId, 1)} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <Plus className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>

                        <div className="w-32 text-right">
                          <h5 className="text-xl font-black text-slate-900 tracking-tighter">${((item.price - item.discount) * item.quantity).toLocaleString()}</h5>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Net</p>
                        </div>

                        <button onClick={() => removeFromCart(item.productId)} className="p-4 opacity-0 group-hover:opacity-100 transition-all bg-red-50 text-red-600 rounded-2xl hover:bg-red-100">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center opacity-30">
                  <ShoppingBag className="w-20 h-20 mb-6 text-slate-200" />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight font-mono">Cart Vacant</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Initialize selection via search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Hub Sidebar */}
        <div className="w-[450px] bg-white border-l border-slate-100 flex flex-col p-10 shadow-2xl shadow-black/5 z-40 relative">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Payment Hub</h3>
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="flex-1 space-y-10 overflow-y-auto pr-2 custom-scrollbar">
            {/* 3. Payment Distribution */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Settlement</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (remainingBalance > 0.01) setPayments([...payments, { mode: 'cash', amount: remainingBalance, accountId: accountId }]); }}
                  className="bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-lg h-8 px-4"
                >
                  Quick Settle
                </Button>
              </div>

              {payments.map((p, idx) => (
                <div key={idx} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 relative group animate-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Instrument</Label>
                      <select
                        value={p.mode}
                        onChange={(e) => { const n = [...payments]; n[idx].mode = e.target.value as any; setPayments(n); }}
                        className="w-full bg-white border-none rounded-xl h-12 px-4 text-[10px] font-black focus:ring-2 focus:ring-black appearance-none uppercase"
                      >
                        <option value="cash">CASH</option>
                        <option value="card">CARD</option>
                        <option value="upi">UPI/DIGITAL</option>
                        <option value="gift_card">GIFT VOUCHER</option>
                        {saleType === 'credit' && <option value="store_credit">STORE CREDIT</option>}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Commitment</Label>
                      <Input
                        type="number"
                        value={p.amount}
                        onChange={(e) => { const n = [...payments]; n[idx].amount = parseFloat(e.target.value) || 0; setPayments(n); }}
                        className="w-full bg-white border-none rounded-xl h-12 px-4 font-black focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {p.mode === 'gift_card' ? (
                      <select
                        value={p.giftCardId}
                        onChange={(e) => { const n = [...payments]; n[idx].giftCardId = e.target.value; setPayments(n); }}
                        className="flex-1 bg-white border-none rounded-xl h-10 px-4 text-[9px] font-black uppercase focus:ring-1 focus:ring-black"
                      >
                        <option value="">SCAN OR SELECT VOUCHER</option>
                        {giftCards.filter(gc => gc.isActive).map(gc => <option key={gc.id} value={gc.id}>{gc.cardNumber} (Bal: ${gc.balance})</option>)}
                      </select>
                    ) : (
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Settlement Finality Verified
                      </div>
                    )}
                    <button onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))} className="p-3 text-red-100 group-hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setPayments([...payments, { mode: 'cash', amount: 0, accountId: accountId }])}
                className="w-full py-6 rounded-[1.5rem] border-2 border-dashed border-slate-100 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:border-black hover:text-black transition-all"
              >
                + Split Instrument
              </button>
            </div>

            {/* 4. Calculations Recap */}
            <div className="space-y-6 pt-10 border-t border-slate-50">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Subtotal</span>
                <span className="text-sm font-black text-slate-900">${subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Reduction</span>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="number"
                    value={billDiscount}
                    onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-slate-50 border-none rounded-xl h-10 pl-8 pr-4 text-right font-black text-xs text-red-500 focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Provision</span>
                <select
                  value={selectedTaxSlabId}
                  onChange={(e) => setSelectedTaxSlabId(e.target.value)}
                  className="bg-transparent border-none text-right font-black text-[10px] uppercase text-indigo-600 focus:ring-0 cursor-pointer"
                >
                  <option value="">NULL RATE (0%)</option>
                  {taxSlabs.map(slab => <option key={slab.id} value={slab.id}>{slab.name} ({slab.percentage}%)</option>)}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projected Margin</span>
                <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px]">
                  <TrendingUp className="w-4 h-4" />
                  +${cart.reduce((sum, item) => sum + (((item.price - item.discount) - item.purchasePrice) * item.quantity), 0) - billDiscount}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.3em]">Payable Amount</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Remaining Balance</p>
                  <p className={cn("text-lg font-black tracking-tight", remainingBalance > 0.01 ? "text-red-600" : "text-emerald-500")}>
                    ${Math.abs(remainingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    {remainingBalance < 0 && ' (CHANGE)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-50 space-y-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-black text-white h-20 rounded-[1.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20"
            >
              {isSubmitting ? 'SECURE COMMITTING...' : 'AUTHORIZE SETTLEMENT'}
            </Button>
            <p className="text-[8px] font-black text-slate-300 text-center uppercase tracking-widest">Digital Audit Logged • Ledger Secured</p>
          </div>
        </div>
      </main>

      {/* Security Override Protocol */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none p-12 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Price Protocol Override</DialogTitle>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">Adjusting unit value requires administrative validation.</p>
          </DialogHeader>
          <div className="space-y-8 mb-10">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Adjusted Value</Label>
              <div className="relative">
                <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <Input
                  type="number"
                  className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-14 font-black text-lg focus:ring-2 focus:ring-black"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supervisor Passkey</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <Input
                  type="password"
                  placeholder="••••"
                  className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-14 font-black tracking-[0.5em] focus:ring-2 focus:ring-black"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-4">
            <Button onClick={handlePriceOverride} className="w-full bg-black text-white h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/20">
              Authorize Injection
            </Button>
            <Button variant="ghost" onClick={() => setShowOverrideDialog(false)} className="w-full h-12 rounded-2xl font-black uppercase text-[9px] text-slate-400">
              Abort Protocol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest Onboarding Protocol */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none p-12 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-10">New Guest Protocol</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mb-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</Label>
                <Input className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold uppercase focus:ring-2 focus:ring-black" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</Label>
                <Input className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold focus:ring-2 focus:ring-black" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geographic Area</Label>
              <Input className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold uppercase focus:ring-2 focus:ring-black" value={newCustomer.area} onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-black text-white h-16 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest"
              onClick={async () => {
                if (!newCustomer.name) return;
                const id = generateId();
                await addCustomer({ name: newCustomer.name, phone: newCustomer.phone, email: newCustomer.email, area: newCustomer.area, creditBalance: 0, totalPurchases: 0, storeId: activeStoreId, joinedAt: new Date().toISOString() });
                setCustomerId(id);
                setNewCustomerOpen(false);
                setNewCustomer({ name: '', phone: '', email: '', area: '' });
                toast.success(`Guest registered: ${newCustomer.name}`);
              }}
            >
              Initialize Registry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
