import { useState, useMemo } from 'react';
import { ShoppingBag, RefreshCw, AlertCircle, Search, Filter, Eye, Truck, CheckCircle, Clock } from 'lucide-react';
import { useERPStore } from '@/lib/store-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const EcommerceOrders = () => {
    const { getStoreSales, getStoreCustomers } = useERPStore();
    const [searchTerm, setSearchTerm] = useState("");

    const orders = useMemo(() => {
        const allSales = getStoreSales();
        const customers = getStoreCustomers();

        return allSales
            .filter(s => s.source === 'Online')
            .map(sale => {
                const customer = customers.find(c => c.id === sale.customerId);
                return {
                    ...sale,
                    email: customer?.email || "No email",
                    order_id: sale.invoiceNumber,
                    full_name: sale.customerName || "Guest",
                    created_at: sale.date,
                    amount: sale.totalAmount,
                };
            });
    }, [getStoreSales, getStoreCustomers]);

    const isLoading = false;
    const error = null;

    const fetchOrders = () => {
        // Data is reactive via store, but we can keep the function signature.
    };

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle className="w-3 h-3" />;
            case 'shipped': return <Truck className="w-3 h-3" />;
            case 'pending': return <Clock className="w-3 h-3" />;
            default: return <ShoppingBag className="w-3 h-3" />;
        }
    };

    const filteredOrders = orders.filter(o =>
        o.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Store Orders</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Monitor customer purchases from your website</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                    <div className="flex flex-col md:flex-row gap-6 mb-12">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search order ID, user, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-16 pl-16 pr-8 bg-slate-50 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <Button onClick={fetchOrders} variant="outline" className="h-16 w-16 rounded-2xl border-slate-200">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <RefreshCw className="w-12 h-12 text-slate-200 animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving order history...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-100" />
                            <p className="text-sm font-black text-slate-900 uppercase">{error}</p>
                            <Button onClick={fetchOrders} variant="ghost" className="uppercase text-[10px] font-black">Try Again</Button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center">
                            <div className="p-8 bg-slate-50 rounded-full text-slate-200">
                                <ShoppingBag className="w-16 h-16" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase">No Orders Found</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Orders from your website will appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6">Order ID</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6">Customer</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6">Date</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6">Amount</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6">Status</TableHead>
                                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((o) => (
                                        <TableRow key={o.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                            <TableCell className="py-6 font-black text-slate-900">
                                                #{o.order_id?.substring(0, 10).toUpperCase() || 'N/A'}
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{o.full_name || "Guest"}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{o.email || "No email"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 text-[10px] font-black text-slate-600 uppercase">
                                                {o.created_at ? new Date(o.created_at).toLocaleDateString() : "N/A"}
                                            </TableCell>
                                            <TableCell className="py-6 font-black text-slate-900">${o.amount || "0.00"}</TableCell>
                                            <TableCell className="py-6">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider",
                                                    getStatusStyles(o.status)
                                                )}>
                                                    <StatusIcon status={o.status || 'pending'} />
                                                    {o.status || 'Pending'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 text-right">
                                                <Button variant="ghost" className="h-10 px-4 rounded-xl hover:bg-white hover:shadow-sm font-black uppercase text-[10px] tracking-widest gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EcommerceOrders;
