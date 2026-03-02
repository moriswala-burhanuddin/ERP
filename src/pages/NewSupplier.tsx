import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore } from '@/lib/store-data';
import { Building2, Save, X, Phone, Mail, MapPin, BadgeDollarSign, Info, ArrowLeft, Globe, Zap, ShieldCheck, CheckCircle2, CreditCard, Banknote, History, Briefcase, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NewSupplier() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { suppliers, addSupplier, updateSupplier, activeStoreId, paymentTerms, getPaymentTerms } = useERPStore();

    const [formData, setFormData] = useState({
        supplierCode: '',
        companyName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        website: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        accountNumber: '',
        openingBalance: 0,
        paymentTermId: '',
        taxNumber: '',
        creditLimit: 0,
        currency: 'USD',
        status: 'active' as 'active' | 'disabled',
        internalNotes: '',
        comments: '',
    });

    const isEditMode = Boolean(id);

    useEffect(() => {
        getPaymentTerms();
    }, [getPaymentTerms]);

    useEffect(() => {
        if (isEditMode) {
            const supplier = suppliers.find(s => s.id === id);
            if (supplier) {
                setFormData({
                    supplierCode: supplier.supplierCode || '',
                    companyName: supplier.companyName,
                    firstName: supplier.firstName || '',
                    lastName: supplier.lastName || '',
                    email: supplier.email || '',
                    phone: supplier.phone || '',
                    website: supplier.website || '',
                    addressLine1: supplier.addressLine1 || '',
                    addressLine2: supplier.addressLine2 || '',
                    city: supplier.city || '',
                    state: supplier.state || '',
                    zipCode: supplier.zipCode || '',
                    country: supplier.country || '',
                    accountNumber: supplier.accountNumber || '',
                    openingBalance: supplier.openingBalance || 0,
                    paymentTermId: supplier.paymentTermId || '',
                    taxNumber: supplier.taxNumber || '',
                    creditLimit: supplier.creditLimit || 0,
                    currency: supplier.currency || 'USD',
                    status: (supplier.status === 'disabled' ? 'disabled' : 'active') as 'active' | 'disabled',
                    internalNotes: supplier.internalNotes || '',
                    comments: supplier.comments || '',
                });
            } else {
                toast.error("IDENTIFICATION ERROR: Supplier node not found in registry.");
                navigate('/suppliers');
            }
        }
    }, [id, isEditMode, suppliers, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'openingBalance' || name === 'creditLimit' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName) {
            toast.error("VALIDATION FAILURE: Company Name is a mandatory identifier.");
            return;
        }

        try {
            if (isEditMode && id) {
                await updateSupplier(id, formData);
                toast.success("Identity Updated & Synchronized");
            } else {
                await addSupplier({
                    ...formData,
                    storeId: activeStoreId,
                    isPreferred: false,
                    isBlacklisted: false,
                    rating: 0,
                });
                toast.success("New Partner Onboarded Successfully");
            }
            navigate('/suppliers');
        } catch (error) {
            toast.error("PROTOCOL FAILURE: Registry update rejected.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-40">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/suppliers')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{isEditMode ? 'Modify Partner' : 'Partner Onboarding'}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{isEditMode ? 'Updating existing verified source' : 'Registering a new production node'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate('/suppliers')} className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] text-slate-400">
                            Discard
                        </Button>
                        <Button onClick={handleSubmit} className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            {isEditMode ? 'Synchronize' : 'Authorize Partner'}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Identity */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Entity Identification</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Registry and legal identifiers</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Entity ERP Code</Label>
                                    <Input
                                        name="supplierCode"
                                        value={formData.supplierCode}
                                        onChange={handleChange}
                                        placeholder="E.G. PRS-XYZ-01..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Corporate Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="LEGAL ENTITY NAME..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">First Name (Direct Dial)</Label>
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="CONTACT NAME..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Last Name (Direct Dial)</Label>
                                    <Input
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="SURNAME..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Geospatial Data</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Logistics and routing parameters</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Digital Node (Email)</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <Input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="VENDOR@DAOMAIN.COM"
                                            className="h-16 bg-slate-50 border-none rounded-2xl pl-16 pr-6 text-sm font-bold focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Universal Dial (Phone)</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <Input
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+00 000 000 0000"
                                            className="h-16 bg-slate-50 border-none rounded-2xl pl-16 pr-6 text-sm font-bold focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Corporate Headquarters (Line 1)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <Input
                                        name="addressLine1"
                                        value={formData.addressLine1}
                                        onChange={handleChange}
                                        placeholder="STREET ADDRESS, BLOCK, SECTOR..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl pl-16 pr-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Terminal (City)</Label>
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="CITY..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sector (State)</Label>
                                    <Input
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="STATE..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold uppercase focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Registry Code (Zip)</Label>
                                    <Input
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        placeholder="ZIP CODE..."
                                        className="h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-black placeholder:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Financial Parameters */}
                <div className="space-y-8">
                    <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl shadow-black/20 overflow-hidden relative group">
                        <Zap className="absolute -right-10 -top-10 w-40 h-40 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <BadgeDollarSign className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Fiscal Ledger</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Financial reconciliation index</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Initial Balance Exposure</Label>
                                    <Input
                                        name="openingBalance"
                                        type="number"
                                        value={formData.openingBalance}
                                        onChange={handleChange}
                                        className="h-16 bg-white/5 border-none rounded-2xl px-6 text-white text-xl font-black focus:ring-2 focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Authorized Credit Limit</Label>
                                    <Input
                                        name="creditLimit"
                                        type="number"
                                        value={formData.creditLimit}
                                        onChange={handleChange}
                                        className="h-16 bg-white/5 border-none rounded-2xl px-6 text-white text-xl font-black focus:ring-2 focus:ring-white/20"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Standard Settlement Terms</Label>
                                    <select
                                        name="paymentTermId"
                                        value={formData.paymentTermId}
                                        onChange={handleChange}
                                        className="w-full h-16 bg-white/5 border-none rounded-2xl px-6 text-sm font-black text-white focus:ring-2 focus:ring-white/20 appearance-none"
                                    >
                                        <option value="" className="bg-slate-900">Choose Terms...</option>
                                        {paymentTerms.map(term => (
                                            <option key={term.id} value={term.id} className="bg-slate-900">{term.name.toUpperCase()} ({term.days} DAYS)</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white">
                        <div className="flex items-center gap-3 mb-8">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Security Parameters</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax ID / VAT Registry</Label>
                                <Input
                                    name="taxNumber"
                                    value={formData.taxNumber}
                                    onChange={handleChange}
                                    placeholder="TAX IDENTIFICATION..."
                                    className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-xs font-bold uppercase focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Status</Label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[10px] font-black uppercase focus:ring-2 focus:ring-black appearance-none"
                                >
                                    <option value="active">Active Entry</option>
                                    <option value="disabled">Restricted / Disabled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
