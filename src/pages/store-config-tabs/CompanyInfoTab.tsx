import { useStoreConfig } from '@/lib/store-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2, Building2, Globe, Database, Cpu, ShieldCheck, RefreshCw, HardDrive, KeyRound, Link2, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function CompanyInfoTab() {
    const {
        companyName, taxId, websiteUrl, etimsApiUrl,
        aiHostUrl, aiSearchUsername, aiSearchPassword, aiSearchClientId,
        updateConfig
    } = useStoreConfig();

    return (
        <div className="space-y-12">
            {/* Sector 1: Identity Matrix */}
            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-black rounded-xl text-white">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Company Details</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Basic information about your business and logo.</p>
                </div>

                <div className="lg:col-span-8 grid gap-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" /> Company Name
                            </Label>
                            <Input
                                value={companyName}
                                onChange={e => updateConfig({ companyName: e.target.value })}
                                placeholder="ENTER COMPANY NAME"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> Tax Number (Tax ID)
                            </Label>
                            <Input
                                value={taxId}
                                onChange={e => updateConfig({ taxId: e.target.value })}
                                placeholder="ENTER TAX NUMBER"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5" /> Website Address
                            </Label>
                            <Input
                                value={websiteUrl}
                                onChange={e => updateConfig({ websiteUrl: e.target.value })}
                                placeholder="HTTPS://WWW.YOURSTORE.COM"
                                className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Logo</Label>
                        <div className="flex items-center gap-8 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 group transition-all">
                            <div className="h-32 w-32 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white group-hover:border-black transition-all relative overflow-hidden">
                                <ImagePlus className="h-8 w-8 text-slate-200 group-hover:text-black transition-colors" />
                                <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] mt-3">Upload Logo</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button variant="ghost" className="h-12 px-8 rounded-2xl bg-white text-slate-400 hover:text-black font-black uppercase text-[9px] tracking-widest shadow-sm border border-slate-100">Change Logo</Button>
                                <Button variant="ghost" className="h-12 px-8 rounded-2xl bg-white text-rose-300 hover:text-rose-600 font-black uppercase text-[9px] tracking-widest shadow-sm border border-slate-100 flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" /> Delete Logo
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sector 2: Integration Nexus */}
            <div className="pt-12 border-t border-slate-100 grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-500 rounded-xl text-white">
                            <Link2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Connections</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Settings for connecting to external services and AI.</p>
                </div>

                <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ETIMS API Address</Label>
                        <Input
                            value={etimsApiUrl}
                            onChange={e => updateConfig({ etimsApiUrl: e.target.value })}
                            placeholder="HTTPS://ETIMS.GATEWAY.ADDRESS"
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Cpu className="w-3.5 h-3.5" /> AI Server Address
                        </Label>
                        <Input
                            value={aiHostUrl}
                            onChange={e => updateConfig({ aiHostUrl: e.target.value })}
                            placeholder="HTTPS://AI.SERVER.URL"
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Username</Label>
                        <Input
                            value={aiSearchUsername}
                            onChange={e => updateConfig({ aiSearchUsername: e.target.value })}
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5" /> AI Password
                        </Label>
                        <Input
                            type="password"
                            value={aiSearchPassword}
                            onChange={e => updateConfig({ aiSearchPassword: e.target.value })}
                            className="h-14 bg-slate-50 border-none rounded-2xl px-6 text-[11px] font-black uppercase"
                        />
                    </div>
                </div>
            </div>

            {/* Sector 3: Maintenance Protocols */}
            <div className="pt-12 border-t border-slate-100 grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-100 rounded-xl text-slate-900 border border-slate-200">
                            <Database className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">System Settings</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Tools for backing up data and checking for updates.</p>
                </div>

                <div className="lg:col-span-8">
                    <div className="flex gap-4">
                        <Button variant="ghost" className="h-16 px-10 rounded-[1.8rem] bg-slate-50 border border-slate-100 text-slate-600 hover:text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                            <HardDrive className="w-5 h-5 text-indigo-400" />
                            Back Up Data Now
                        </Button>
                        <Button variant="ghost" className="h-16 px-10 rounded-[1.8rem] bg-slate-50 border border-slate-100 text-slate-600 hover:text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                            <RefreshCw className="w-5 h-5 text-emerald-400" />
                            Check for Updates
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
