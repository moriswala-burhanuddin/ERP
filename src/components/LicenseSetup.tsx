import React, { useState } from "react";
import { useLicense } from "../contexts/LicenseContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { KeyRound, ShieldCheck, Loader2, Building, MonitorSmartphone } from "lucide-react";

const LicenseSetup = () => {
  const [keyInput, setKeyInput] = useState("");
  const { verifyLicense, isLoading, deviceId } = useLicense();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    await verifyLicense(keyInput.trim());
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
      
      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="mx-auto w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-blue-500/50">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">StoreFlow ERP</h1>
          <p className="text-slate-400">Enterprise Resource Planning System</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl shadow-blue-900/20 animate-fade-in-up [animation-delay:100ms]">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-500" />
              Activate License
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Please enter your organization's license key to activate this device.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleVerify}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">License Key</label>
                <Input 
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="e.g. XXXX-XXXX-XXXX-XXXX"
                  className="bg-slate-950 border-slate-700 text-white font-mono placeholder:text-slate-600 focus-visible:ring-blue-500 h-12"
                  autoFocus
                />
              </div>

              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <MonitorSmartphone className="w-4 h-4 text-slate-500" />
                  <span>Device ID: <span className="font-mono text-slate-300 ml-1">{deviceId?.substring(0, 8)}...</span></span>
                </div>
                <div className="flex text-sm text-slate-400">
                  <Building className="w-4 h-4 text-slate-500 mr-2 mt-0.5" />
                  <p className="leading-snug">This device will be registered to your organization's license upon activation.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-900/20"
                disabled={!keyInput.trim() || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying License...
                  </>
                ) : (
                  "Activate Device"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-8 animate-fade-in-up [animation-delay:200ms]">
          Protected by StoreFlow Security. Need help? Contact support.
        </p>
      </div>
    </div>
  );
};

export default LicenseSetup;
