import { StockTransferForm } from "@/components/inventory/StockTransferForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StockJournal() {
    return (
        <div className="p-6 space-y-6 min-h-screen bg-slate-50/50">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Move Stock</h1>
                    <p className="text-muted-foreground font-medium">Transfer items between stores or warehouses</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Panel / Voucher Rules */}
                <div className="space-y-6">
                    <Card className="bg-amber-50 border-amber-100">
                        <CardHeader>
                            <CardTitle className="text-amber-800 text-sm font-bold uppercase tracking-widest">How to Move Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-amber-900/80">
                            <p>Use this page to move items from one shop or warehouse to another.</p>
                            <ul className="list-disc pl-4 space-y-2">
                                <li>Select the <strong>Source Store</strong> (Consignor) where goods are leaving.</li>
                                <li>Select the <strong>Destination Store</strong> (Consignee) where goods are arriving.</li>
                                <li>This will update the stock levels in both stores automatically.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* The Transfer Form */}
                <div className="lg:col-span-2">
                    <StockTransferForm />
                </div>
            </div>
        </div>
    );
}
