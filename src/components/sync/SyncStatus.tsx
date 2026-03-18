import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useERPStore } from '@/lib/store-data';

export function SyncStatus() {
    const { accessToken, isSyncing, syncData } = useERPStore();
    const [status, setStatus] = useState<'synced' | 'dirty' | 'syncing' | 'error'>('synced');
    const [dirtyCount, setDirtyCount] = useState(0);
    const { toast } = useToast();

    const checkSyncStatus = async () => {
        if (!window.electronAPI) return;
        try {
            const result = await window.electronAPI.getDirtyData();
            if (result && result.totalCount > 0) {
                setStatus('dirty');
                setDirtyCount(result.totalCount);
            } else {
                setStatus('synced');
                setDirtyCount(0);
            }
        } catch (error) {
            console.error('Failed to check sync status:', error);
            setStatus('error');
        }
    };

    useEffect(() => {
        checkSyncStatus();
        const interval = setInterval(checkSyncStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    // Update internal status when store syncing changes
    useEffect(() => {
        if (isSyncing) {
            setStatus('syncing');
        } else {
            checkSyncStatus();
        }
    }, [isSyncing]);

    const handleSync = async () => {
        if (!accessToken) {
            toast({ title: "Authentication Required", description: "Please login to sync data.", variant: "destructive" });
            return;
        }

        try {
            const result = await syncData();
            
            if (result === 'success') {
                toast({
                    title: "Sync Success",
                    description: "Two-way synchronization completed.",
                    variant: "default"
                });
            } else if (result === 'already_syncing') {
                toast({
                    title: "Sync In Progress",
                    description: "A background synchronization is already running. Please Wait...",
                    variant: "default"
                });
            } else if (result === 'bypass_mode' || result === 'no_token') {
                toast({
                    title: "Sync Skipped",
                    description: "Cloud sync is disabled for local/bypass sessions. Please login with a Django account.",
                    variant: "default"
                });
            } else if (result === 'not_electron') {
                toast({
                    title: "Sync Not Available",
                    description: "Cloud sync is only available in the Desktop App.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Sync Failed",
                    description: "The synchronization encountered an error. Check console for details.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Manual sync failed:', error);
            const isNetworkError = error instanceof TypeError || ((error as Error)?.message?.includes('fetch'));

            toast({
                title: "Sync Failed",
                description: isNetworkError ? "Could not connect to server." : `Error: ${(error as Error).message}`,
                variant: "destructive"
            });
        }
    };

    if (!window.electronAPI) return null;

    return (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Cloud Sync
                </span>
                {status === 'synced' && <span className="text-[10px] text-green-500 font-bold">ONLINE</span>}
                {status === 'dirty' && <span className="text-[10px] text-yellow-500 font-bold">UNSAVED CLOUD</span>}
                {status === 'error' && <span className="text-[10px] text-red-500 font-bold">OFFLINE</span>}
            </div>

            <div className="flex items-center gap-2">
                <div className={`flex-1 flex items-center gap-2 p-2 rounded border transition-colors ${status === 'synced' ? 'bg-slate-800/50 border-slate-700 text-slate-400' :
                    status === 'dirty' ? 'bg-yellow-900/10 border-yellow-700/50 text-yellow-500' :
                        status === 'syncing' ? 'bg-blue-900/10 border-blue-700/50 text-blue-400' :
                            'bg-red-900/10 border-red-700/50 text-red-500'
                    }`}>
                    {status === 'synced' && <CheckCircle className="w-4 h-4" />}
                    {status === 'dirty' && <CloudOff className="w-4 h-4" />}
                    {status === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4" />}

                    <span className="text-xs font-bold">
                        {status === 'synced' && "All Synced"}
                        {status === 'dirty' && `${dirtyCount} Changes Pending`}
                        {status === 'syncing' && "Syncing..."}
                        {status === 'error' && "Connection Error"}
                    </span>
                </div>

                <button
                    onClick={handleSync}
                    disabled={status === 'syncing' || status === 'synced'}
                    className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded transition-colors"
                    title="Sync Now"
                >
                    <RefreshCw className={`w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
    );
}
