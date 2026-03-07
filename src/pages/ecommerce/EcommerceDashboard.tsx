import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users, Package, TrendingUp, ArrowLeft, RefreshCw, ExternalLink, AlertCircle, Star, MessageSquare } from 'lucide-react';
import { useERPStore } from '@/lib/store-data';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const EcommerceDashboard = () => {
    const navigate = useNavigate();
    const { getStoreSales, getStoreCustomers, getStoreProducts } = useERPStore();

    // Calculate stats purely from central ERP data
    const stats = useMemo(() => {
        const allSales = getStoreSales();
        const onlineSales = allSales.filter(s => s.source === 'Online');

        const allCustomers = getStoreCustomers();
        const onlineCustomers = allCustomers.filter(c => c.source === 'Online');

        const allProducts = getStoreProducts();

        const totalSales = onlineSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

        return {
            total_sales: `$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            total_orders: onlineSales.length.toString(),
            total_projects: allProducts.length.toString(),
            total_users: onlineCustomers.length.toString()
        };
    }, [getStoreSales, getStoreCustomers, getStoreProducts]);

    const isLoading = false;
    const error = null;

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <Icon className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative z-10">
                <div className={`p-4 ${color} rounded-2xl w-fit mb-6 text-white shadow-xl`}>
                    <Icon className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    {value}
                </h3>
            </div>
        </div>
    );

    if (error) {
        return (
            <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md border border-red-50">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Store Connection Issue</h2>
                    <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                        {error}. <br /> Please check your "Online Store Settings" in the config panel.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button className="rounded-2xl h-14 bg-black text-white font-black uppercase tracking-widest text-[10px]">
                            Try Again
                        </Button>
                        <Button onClick={() => navigate('/store-config')} variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">
                            Go to Settings
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Online Store Overview</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Real-time status of your Elegance website</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button disabled={isLoading} variant="outline" className="h-12 w-12 rounded-xl border-slate-200 p-0">
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button className="h-12 px-8 rounded-xl bg-black text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-black/10">
                            <ExternalLink className="w-4 h-4" />
                            Visit Store
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard
                        title="Total Sales"
                        value={stats?.total_sales || "0"}
                        icon={TrendingUp}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Orders"
                        value={stats?.total_orders || "0"}
                        icon={ShoppingBag}
                        color="bg-blue-600"
                    />
                    <StatCard
                        title="Products"
                        value={stats?.total_projects || "0"}
                        icon={Package}
                        color="bg-purple-600"
                    />
                    <StatCard
                        title="Customers"
                        value={stats?.total_users || "0"}
                        icon={Users}
                        color="bg-orange-500"
                    />
                </div>

                {/* Quick Actions / Recent Activity */}
                <div className="mt-12 grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-[3rem] p-12 shadow-sm border border-white">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Manage Store</h3>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <button
                                onClick={() => navigate('/ecommerce/products')}
                                className="p-8 bg-slate-50 rounded-[2rem] text-left hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 group"
                            >
                                <div className="p-4 bg-white rounded-2xl w-fit mb-6 text-slate-900 shadow-sm group-hover:shadow-md transition-all">
                                    <Package className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">Manage Products</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Update items on your website</p>
                            </button>
                            <button
                                onClick={() => navigate('/ecommerce/orders')}
                                className="p-8 bg-slate-50 rounded-[2rem] text-left hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 group"
                            >
                                <div className="p-4 bg-white rounded-2xl w-fit mb-6 text-slate-900 shadow-sm group-hover:shadow-md transition-all">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">View Orders</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Check new customer purchases</p>
                            </button>
                            <button
                                onClick={() => navigate('/ecommerce/reviews')}
                                className="p-8 bg-slate-50 rounded-[2rem] text-left hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 group"
                            >
                                <div className="p-4 bg-white rounded-2xl w-fit mb-6 text-slate-900 shadow-sm group-hover:shadow-md transition-all">
                                    <Star className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">Reviews</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Manage project reviews</p>
                            </button>
                            <button
                                onClick={() => navigate('/ecommerce/feedback')}
                                className="p-8 bg-slate-50 rounded-[2rem] text-left hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 group"
                            >
                                <div className="p-4 bg-white rounded-2xl w-fit mb-6 text-slate-900 shadow-sm group-hover:shadow-md transition-all">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 uppercase">Feedback</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Check user inquiries</p>
                            </button>
                        </div>
                    </div>

                    <div className="bg-black rounded-[3rem] p-12 shadow-xl shadow-black/10 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Users className="w-64 h-64 text-white rotate-12" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 relative z-10">Store Community</h3>
                        <p className="text-xs text-white/60 leading-relaxed mb-8 relative z-10">
                            Your website currently has {stats?.total_users || 0} registered users.
                            Keep track of your online customer base and their shopping habits.
                        </p>
                        <Button variant="outline" className="w-full h-14 rounded-2xl bg-white/10 border-white/20 text-white font-black uppercase text-[10px] tracking-widest relative z-10 hover:bg-white/20">
                            View Customer List
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EcommerceDashboard;
