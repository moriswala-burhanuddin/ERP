import { useStoreConfig } from '@/lib/store-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Mail, Globe, Cloud, Database, Code, Zap, ShieldCheck, MoreHorizontal, LayoutGrid, Smartphone, Target, Activity, Share2, Store, Link2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';
import { eleganceApi } from '@/lib/elegance-api';

export function IntegrationsTab() {
    const {
        emailSettingsHtml, ssoInfo, quickbooksIntegration, ecommerceIntegration,
        ecommerceEnabled, ecommerceApiUrl, ecommerceAuthToken,
        apiSettings, webhooks, lookupApi,
        updateConfig
    } = useStoreConfig();

    const [isTesting, setIsTesting] = useState(false);

    const handleTestConnection = async () => {
        if (!ecommerceApiUrl) {
            toast.error("Please enter a Store Website Link first.");
            return;
        }

        setIsTesting(true);
        try {
            await toast.promise(eleganceApi.getStoreSummary(), {
                loading: 'Checking connection to your store...',
                success: 'Connection to store established!',
                error: (err) => err.message || 'Failed to connect to store.'
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Sector 1: Online Store Settings (NEW) */}
            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                            <Store className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Online Store Settings</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Connect your Elegance website (hosted on PythonAnywhere) to manage stock and orders directly from here.</p>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                        <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Show Online Store Section</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Check this to see the store menu in your sidebar</p>
                        </div>
                        <Switch
                            checked={ecommerceEnabled}
                            onCheckedChange={(val) => updateConfig({ ecommerceEnabled: val })}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Link2 className="w-3.5 h-3.5" /> Store Website Link
                            </Label>
                            <Input
                                value={ecommerceApiUrl}
                                onChange={e => updateConfig({ ecommerceApiUrl: e.target.value })}
                                placeholder="https://elegancebackend.pythonanywhere.com"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black"
                            />
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 ml-1">Do not include "/admin/" at the end of the link.</p>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> Store Login Key
                            </Label>
                            <Input
                                type="password"
                                value={ecommerceAuthToken}
                                onChange={e => updateConfig({ ecommerceAuthToken: e.target.value })}
                                placeholder="ENTER ACCESS KEY..."
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black"
                            />
                        </div>
                    </div>

                    {/* NEW: Get Key Automatically Helper */}
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase">Don't have a Login Key?</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enter your website details below to get it automatically.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                id="site-email"
                                placeholder="WEBSITE EMAIL"
                                className="h-12 bg-white border-slate-200 rounded-xl px-6 text-[10px] font-black"
                            />
                            <Input
                                id="site-pass"
                                type="password"
                                placeholder="WEBSITE PASSWORD"
                                className="h-12 bg-white border-slate-200 rounded-xl px-6 text-[10px] font-black"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                const email = (document.getElementById('site-email') as HTMLInputElement).value;
                                const pass = (document.getElementById('site-pass') as HTMLInputElement).value;
                                if (!email || !pass) return toast.error("Please enter email and password.");
                                if (!ecommerceApiUrl) return toast.error("Enter your Website Link first.");

                                toast.promise(eleganceApi.login(email, pass), {
                                    loading: 'Fetching your key...',
                                    success: (token) => {
                                        updateConfig({ ecommerceAuthToken: token });
                                        return 'Key found and saved!';
                                    },
                                    error: (err) => err.message || 'Login failed.'
                                });
                            }}
                            className="h-12 px-8 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest"
                        >
                            Login & Get Key
                        </Button>
                    </div>

                    <Button
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest gap-3"
                    >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                        Check Connection
                    </Button>
                </div>
            </div>

            {/* Sector 2: SMTP Communications */}
            <div className="pt-12 border-t border-slate-100 grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-500 rounded-xl text-white">
                            <Mail className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">SMTP Communication</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">System-wide email propagation parameters, transmission templates, and server-side SMTP hooks.</p>
                </div>

                <div className="lg:col-span-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <LayoutGrid className="w-3.5 h-3.5" /> HTML Template / SMTP Topology
                        </Label>
                        <Textarea
                            value={emailSettingsHtml}
                            onChange={e => updateConfig({ emailSettingsHtml: e.target.value })}
                            placeholder="INITIALIZE SMTP PROTOCOL OR HTML NOTIFICATION LAYER..."
                            className="min-h-[160px] bg-slate-50 border-none rounded-[2rem] p-8 text-[11px] font-black uppercase leading-relaxed focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>
            </div>

            {/* Sector 2: Enterprise Bridges */}
            <div className="pt-12 border-t border-slate-100 grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-black rounded-xl text-white">
                            <Cloud className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Enterprise Bridges</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">External data synchonicity for identity providers, fiscal ledgers, and ecommerce nodes.</p>
                </div>

                <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Identity Node (SSO)
                        </Label>
                        <Input
                            value={ssoInfo}
                            onChange={e => updateConfig({ ssoInfo: e.target.value })}
                            placeholder="IDP_CLIENT_IDENTIFIER"
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Database className="w-3.5 h-3.5" /> Fiscal Ledger (QuickBooks)
                        </Label>
                        <Input
                            value={quickbooksIntegration}
                            onChange={e => updateConfig({ quickbooksIntegration: e.target.value })}
                            placeholder="QB_REALM_TOKEN"
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> E-Commerce Nexus (Shopify/Woo)
                        </Label>
                        <Input
                            value={ecommerceIntegration}
                            onChange={e => updateConfig({ ecommerceIntegration: e.target.value })}
                            placeholder="COMMERCE_GATEWAY_API_KEY"
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>
            </div>

            {/* Sector 3: Developer Infrastructure */}
            <div className="pt-12 border-t border-slate-100 grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-500 rounded-xl text-white">
                            <Code className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Dev Infrastructure</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Low-level API hooks, lookup services, and event-driven webhook propagation.</p>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> Internal API Keys
                            </Label>
                            <Input
                                value={apiSettings}
                                onChange={e => updateConfig({ apiSettings: e.target.value })}
                                placeholder="CORE_API_ACCESS_VECTOR"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Share2 className="w-3.5 h-3.5" /> Catalog Lookup Node
                            </Label>
                            <Input
                                value={lookupApi}
                                onChange={e => updateConfig({ lookupApi: e.target.value })}
                                placeholder="https://api.external-catalog.org/..."
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> Event-Driven Webhooks (JSON Matrix)
                        </Label>
                        <Textarea
                            value={webhooks}
                            onChange={e => updateConfig({ webhooks: e.target.value })}
                            placeholder='[{"event": "SALE_COMPLETED", "url": "https://..."}]'
                            className="min-h-[140px] bg-slate-900 text-emerald-400 border-none rounded-[2rem] p-8 text-[11px] font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
