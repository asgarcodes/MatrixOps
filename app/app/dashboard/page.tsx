'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Navbar from '@/components/Navbar'
import {
    LayoutDashboard, CreditCard, Repeat, FileText, Settings,
    Search, Bell, User, HelpCircle, ChevronRight,
    MoreVertical, ArrowUpRight, TrendingUp, Users,
    ShieldCheck, Zap, Download, Filter, Info,
    PlusCircle, ExternalLink, RefreshCw, CheckCircle,
    Activity, ShieldAlert, Navigation, Plus, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import HostEventModal from '@/components/HostEventModal'

export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalPayments: 0,
        successRate: 98.4,
        avgTicket: 499
    })
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('transactions')
    const [showHostModal, setShowHostModal] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            })
        }
    }, [])

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const rsvpsSnap = await getDocs(query(
                    collection(db, "rsvps"),
                    where("user_id", "==", user.uid),
                    orderBy("created_at", "desc"),
                    limit(10)
                ))
                const allRsvps = rsvpsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    amount: 499,
                    status: 'captured'
                }))

                setTransactions(allRsvps)
                setStats({
                    totalRevenue: allRsvps.length * 499,
                    totalPayments: allRsvps.length,
                    successRate: 98.4,
                    avgTicket: 499
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [user])

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/20 flex flex-col md:flex-row">
            {/* Professional Sidebar */}
            <aside className="w-full md:w-64 bg-card border-r border-border flex-shrink-0 flex flex-col min-h-screen sticky top-0">
                <div className="p-8 flex items-center gap-3 border-b border-border">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-black">M</div>
                    <span className="font-bold text-lg tracking-tight">MatrixOps</span>
                </div>

                <div className="flex-grow py-8 px-4 space-y-8 overflow-y-auto">
                    <nav className="space-y-1">
                        {[
                            { icon: LayoutDashboard, label: 'Overview', id: 'home' },
                            { icon: Repeat, label: 'Event Ledger', id: 'transactions' },
                            { icon: CreditCard, label: 'Hostings', id: 'hostings' },
                            { icon: Settings, label: 'Settings', id: 'settings' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all",
                                    activeTab === item.id
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'text-muted hover:text-foreground hover:bg-background border border-transparent hover:border-border'
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-8 border-t border-border">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-4 mb-4">Operations</p>
                        <nav className="space-y-1">
                            {['Sector Map', 'Host Control', 'Logs'].map((label) => (
                                <button key={label} className="w-full flex items-center px-4 py-2 text-xs font-semibold text-muted hover:text-accent transition-colors">
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="p-6 border-t border-border">
                    <Link href="/" className="flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors group">
                        <Navigation className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        Back to site
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow min-h-screen p-8 lg:p-12 bg-background/50">
                <div className="max-w-6xl mx-auto space-y-12">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest">
                                <Activity className="w-3 h-3" /> Live Signal
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight">Dashboard</h2>
                            <p className="text-muted font-medium">Real-time management for your local event synchronization.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowHostModal(true)}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-primary/10"
                            >
                                <Plus className="w-4 h-4" /> Host New Event
                            </button>
                            <Link href="/scan" className="px-6 py-3 bg-card border border-border rounded-xl text-xs font-bold text-foreground hover:bg-accent/5 transition-all flex items-center gap-2">
                                <PlusCircle className="w-4 h-4 text-accent" /> Scan Entry
                            </Link>
                        </div>
                    </header>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
                            { label: 'RSVPs Captured', value: stats.totalPayments, icon: Users, color: 'text-purple-600', bg: 'bg-purple-600/10' },
                            { label: 'Success Rate', value: `${stats.successRate}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
                            { label: 'Avg Value', value: '₹499', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-600/10' },
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-card border border-border p-8 rounded-3xl hover:shadow-xl hover:shadow-accent/5 transition-all group"
                            >
                                <div className="space-y-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", s.bg, s.color)}>
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{s.label}</p>
                                        <h3 className="text-2xl font-black tracking-tight mt-1">{s.value}</h3>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Ledger Table */}
                    <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-accent/[0.02]">
                        <div className="p-8 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest">Recent Node Ledger</h3>
                            <button className="text-[10px] font-bold uppercase text-muted hover:text-accent flex items-center gap-2 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" /> Force Sync
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border bg-background/30">
                                    <tr>
                                        <th className="px-8 py-5">Signal ID</th>
                                        <th className="px-8 py-5">Node Reference</th>
                                        <th className="px-8 py-5">Uplink Status</th>
                                        <th className="px-8 py-5">Value</th>
                                        <th className="px-8 py-5">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-4" />
                                                <p className="text-xs font-bold text-muted">Synchronizing with sector ledger...</p>
                                            </td>
                                        </tr>
                                    ) : transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-accent/[0.02] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <code className="text-xs font-bold text-accent">SIG_{tx.id.slice(0, 8)}</code>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-semibold text-muted">ID: {tx.event_id.slice(0, 6)}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600/10 text-emerald-600 rounded-full border border-emerald-600/20 w-max">
                                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Captured</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-bold">₹499.00</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-semibold text-muted">{tx.created_at?.toDate().toLocaleDateString()}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <p className="text-xs font-bold text-muted">No transactions found in this sector.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showHostModal && (
                    <HostEventModal
                        onClose={() => setShowHostModal(false)}
                        userLocation={userLocation}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
