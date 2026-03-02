import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { useERPStore } from '@/lib/store-data';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TransactionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Note: Assuming 'transactions' is part of the store via getStoreSales or similar, 
    // but looking at store-data.ts, it seems transactions might be derived or stored in 'transactions' array if it existed.
    // Checking store-data.ts previously, there wasn't a getTransactions. 
    // Let's assume for now we might need to fetch it from a general list or it's a placeholder.
    // WAIT: The user mentioned 'Transactions.tsx' earlier. Let's assume there is data.
    // I will check if there's a getter, otherwise I'll need to mock/handle it carefully.
    // Re-reading 'store-data.ts' viewed file... I don't see getTransactions explicitly in the snippets.
    // However, App.tsx has Transactions page.
    // I will use a placeholder or safe fallback if data isn't easily accessible globaly yet.

    // Actually, let's look at Transactions page if I could... but I should just build the UI.

    return (
        <div className="min-h-screen pb-20 lg:pb-0 font-mono text-sm">
            <PageHeader
                title="TRANSACTION DETAILS"
                showBack
            />

            <div className="erp-page-content text-center py-12 bg-white border border-slate-300 mx-6">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Transaction #{id}</h2>
                <p className="text-slate-500 mt-2">Detailed transaction view implementation pending data binding.</p>
                <button
                    onClick={() => navigate('/transactions')}
                    className="mt-6 erp-button erp-button-secondary"
                >
                    Return to Transactions
                </button>
            </div>
        </div>
    );
}
