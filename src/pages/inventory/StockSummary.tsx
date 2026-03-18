import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useERPStore } from "@/lib/store-data";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function StockSummary() {
    const { products } = useERPStore();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalValue = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
    const potentialValue = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0);
    const totalMargin = potentialValue - totalValue;

    return (
        <div className="p-6 space-y-6 min-h-screen bg-slate-50/50">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Stock Report</h1>
                    <p className="text-muted-foreground font-medium">Check your current items and levels.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Stock Value</p>
                    <p className="text-3xl font-black text-slate-900">
                        {formatCurrency(totalValue)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Items</p>
                        <p className="text-2xl font-black text-slate-900">{filteredProducts.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expected Sales Money</p>
                        <p className="text-2xl font-black text-slate-900">
                            {formatCurrency(potentialValue)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-4">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Expected Profit</p>
                        <p className="text-2xl font-black text-emerald-900">
                            {formatCurrency(totalMargin)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-sm mt-6">
                <div className="p-4 border-b flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            placeholder="Search stock..."
                            className="pl-9 pr-4 py-2 w-full text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border-t-0 p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="h-10 px-4 text-left align-middle font-medium text-slate-500">Item</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-slate-500">Type</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 bg-slate-100/50">Amount</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 bg-slate-100/50">Buying Price</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-slate-500 bg-slate-100">Total Value</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-slate-500">Profit per Item</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => {
                                    const margin = p.sellingPrice - p.purchasePrice;
                                    const marginPercent = p.purchasePrice > 0 ? (margin / p.purchasePrice) * 100 : 100;

                                    return (
                                        <tr key={p.id} className="border-b hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-900">
                                                {p.name}
                                                <div className="text-[10px] font-normal text-slate-400 font-mono mt-0.5">{p.sku}</div>
                                            </td>
                                            <td className="p-4 text-slate-500 text-xs uppercase tracking-wide">
                                                {p.categoryId}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-700 bg-slate-50/30">
                                                {p.quantity} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                                            </td>
                                            <td className="p-4 text-right font-mono font-medium text-slate-700 bg-slate-50/30">
                                                {formatCurrency(p.purchasePrice)}
                                            </td>
                                            <td className="p-4 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                                                {formatCurrency(p.quantity * p.purchasePrice)}
                                            </td>
                                            <td className="p-4 text-right font-mono font-medium">
                                                <span className={margin > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                                    {formatCurrency(margin)} ({Math.round(marginPercent)}%)
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No stock items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
