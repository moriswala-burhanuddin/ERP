import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Star, Target, Brain, TrendingUp, ShieldCheck, Zap, BarChart2 } from "lucide-react";
import { toast } from "sonner";

const Performance = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const reviews = [
        { id: 1, name: "Alice Smith", month: "January 2026", kpi: 92, rating: 5, comments: "Exceptional sales velocity and client acquisition protocols exceeded monthly targets by 18%.", sector: "Sales" },
        { id: 2, name: "Bob Jones", month: "January 2026", kpi: 78, rating: 4, comments: "Strong performance but temporal drift detected in punctuality matrix. Requires recalibration.", sector: "Inventory" },
        { id: 3, name: "Carol Lee", month: "January 2026", kpi: 86, rating: 4, comments: "High-fidelity customer satisfaction scores. Communication protocol architecture exemplary.", sector: "Support" },
    ];

    const avgKpi = Math.round(reviews.reduce((sum, r) => sum + r.kpi, 0) / reviews.length);
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setTimeout(() => {
            setAnalyzing(false);
            toast.success("Intelligence Synthesis Complete: Performance matrix calibrated.");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-32">
            {/* Superior Header */}
            <div className="bg-white border-b border-slate-100 z-50 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => window.history.back()} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Velocity Intelligence Matrix</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">KPI Synthesis • Personnel Performance Analytics</p>
                        </div>
                    </div>
                    <Button onClick={handleAnalyze} disabled={analyzing} className="bg-black text-white rounded-[1.2rem] h-14 px-10 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-3">
                        <Brain className={cn("w-4 h-4 text-indigo-400", analyzing && "animate-pulse")} />
                        {analyzing ? "Synthesizing..." : "Calibrate AI Insights"}
                    </Button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-10">
                {/* Intelligence Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white">
                        <div className="p-4 bg-indigo-50 rounded-2xl w-fit mb-8 text-indigo-500">
                            <Target className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg KPI Achievement</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{avgKpi}%</h3>
                        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avgKpi}%` }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-white">
                        <div className="p-4 bg-amber-50 rounded-2xl w-fit mb-8 text-amber-500">
                            <Star className="w-6 h-6 fill-current" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Performance Score</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{avgRating} / 5</h3>
                        <div className="flex gap-1 mt-4">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-5 h-5", s <= parseFloat(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100")} />)}
                        </div>
                    </div>
                    <div className="bg-black rounded-[2.5rem] p-10 text-white shadow-2xl shadow-black/20 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl text-emerald-400">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Workforce Operational</span>
                        </div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">{reviews.length} Personnel Nodes Evaluated</p>
                    </div>
                </div>

                {/* Review Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review, idx) => (
                        <div key={review.id} className="bg-white rounded-[3rem] p-10 border-2 border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-black group-hover:text-white transition-all shadow-inner text-2xl font-black">
                                    {review.name.charAt(0)}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-4 h-4", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-100 fill-slate-100")} />)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">{review.sector}</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors mb-1">{review.name}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{review.month}</p>

                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">KPI Achievement</span>
                                        <span className={cn("text-sm font-black", review.kpi >= 90 ? "text-emerald-600" : review.kpi >= 75 ? "text-indigo-600" : "text-amber-600")}>{review.kpi}%</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", review.kpi >= 90 ? "bg-emerald-500" : review.kpi >= 75 ? "bg-indigo-500" : "bg-amber-500")}
                                            style={{ width: `${review.kpi}%` }}
                                        />
                                    </div>
                                </div>

                                <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed border-l-4 border-slate-100 pl-4 group-hover:border-indigo-200 transition-colors">
                                    &ldquo;{review.comments}&rdquo;
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Performance;
