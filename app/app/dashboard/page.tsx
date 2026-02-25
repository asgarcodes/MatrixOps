'use client'
export const dynamic = 'force-dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { collection, query, where, onSnapshot, deleteDoc, doc, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Navbar from '@/components/Navbar'
import {
    LayoutDashboard, CreditCard, Repeat, Settings,
    TrendingUp, TrendingDown, Users, Loader2, Trash2,
    Activity, Plus, MapPin, Calendar, Clock, Tag, Radio,
    BarChart3, ArrowUpRight, ArrowDownRight, Inbox
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import HostEventModal from '@/components/HostEventModal'
import BroadcastModal from '@/components/BroadcastModal'
import { useAudio } from '@/hooks/useAudio'
import { Sparkline, LineChart } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCountUp } from '@/hooks/useCountUp'

// ---- Animation variants ----
const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.1
        }
    }
}

const itemVariants: any = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    }
}

const cardHover: any = {
    rest: { y: 0, scale: 1 },
    hover: {
        y: -2,
        scale: 1.005,
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
    }
}

// Generate static mock data outside component to avoid re-creation and improve compilation speed
const generateRevenueData = () => {
    const days = 30
    const data = []
    let baseValue = 8000

    for (let i = 0; i < days; i++) {
        const variance = Math.random() * 2000 - 1000
        baseValue += variance * 0.3
        data.push({
            label: `Day ${i + 1}`,
            value: Math.max(5000, Math.min(15000, baseValue))
        })
    }
    return data
}
const staticRevenueData = generateRevenueData();
const staticSparklineData = staticRevenueData.slice(-7).map(d => d.value);

// ---- KPI Count-Up Component ----
function AnimatedKPI({ value, prefix = '', suffix = '', decimals = 0, loading }: {
    value: number, prefix?: string, suffix?: string, decimals?: number, loading: boolean
}) {
    const { formatted } = useCountUp({
        end: value,
        duration: 1400,
        decimals,
        enabled: !loading,
        prefix,
        suffix
    })

    if (loading) return <Skeleton className="h-10 w-32" />

    return (
        <motion.span
            className="tabular-nums"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            {formatted}
        </motion.span>
    )
}


// ---- Sidebar Navigation Item ----
function SidebarNavItem({ item, isActive, onClick }: {
    item: { id: string, label: string, icon: any, description: string },
    isActive: boolean,
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                    ? "sidebar-item-active bg-accent/8 text-foreground"
                    : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
            )}
        >
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                isActive
                    ? "bg-accent/15 text-accent"
                    : "bg-transparent text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent"
            )}>
                <item.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
                <div className={cn(
                    "text-sm font-semibold leading-none",
                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                    {item.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.description}
                </div>
            </div>
        </button>
    )
}


export default function DashboardPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalPayments: 0,
        successRate: 98.4,
        avgTicket: 499,
        revenueChange: 0,
        paymentsChange: 0
    })
    const [transactions, setTransactions] = useState<any[]>([])
    const [hostedEvents, setHostedEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('transactions')
    const [showHostModal, setShowHostModal] = useState(false)
    const [selectedBroadcastEvent, setSelectedBroadcastEvent] = useState<any>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
    const { playSound } = useAudio()

    // Optimized lookup map to avoid O(N) searches during table rendering
    const lookupMap = useMemo(() => {
        const map: Record<string, string> = {};
        hostedEvents.forEach(e => {
            map[e.id] = e.title;
        });
        return map;
    }, [hostedEvents]);

    const revenueChartData = useMemo(() => staticRevenueData, [])
    const sparklineData = useMemo(() => staticSparklineData, [])

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            })
        }
    }, [])

    useEffect(() => {
        if (!user || !db) {
            setLoading(false)
            return
        }

        // Fetch Host's Event RSVPs (Real-time tracking)
        const rsvpQ = query(
            collection(db, "rsvps"),
            where("organizer_id", "==", user.uid)
        )

        // Detect check-ins in real-time
        const unsubscribeRsvps = onSnapshot(rsvpQ, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const data: any = change.doc.data();
                    if (data.checked_in_at) {
                        playSound('success');
                    }
                }
            });

            const allRsvps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                amount: 499,
                status: 'captured'
            }))

            // Client-side sort for performance
            allRsvps.sort((a: any, b: any) => {
                const timeA = a.created_at?.seconds || 0
                const timeB = b.created_at?.seconds || 0
                return timeB - timeA
            })

            setTransactions(prev => {
                const head = allRsvps.slice(0, 10);
                if (JSON.stringify(prev) === JSON.stringify(head)) return prev;
                return head;
            })

            // Calculate stats based on host's RSVPs
            const totalRev = allRsvps.length * 499
            const checkedInCount = allRsvps.filter((r: any) => r.checked_in_at).length

            setStats(prev => {
                const newStats = {
                    ...prev,
                    totalRevenue: totalRev,
                    totalPayments: allRsvps.length,
                    successRate: allRsvps.length > 0 ? parseFloat(((checkedInCount / allRsvps.length) * 100).toFixed(1)) : 0
                };
                if (JSON.stringify(prev) === JSON.stringify(newStats)) return prev;
                return newStats;
            })
            setLoading(false)
        }, (error) => {
            console.error("Error fetching transactions:", error)
            setLoading(false)
        })

        if (!user || !db) return

        // Fetch Hosted Events
        const eventsQ = query(
            collection(db, "events"),
            where("user_id", "==", user.uid)
        )

        const unsubscribeEvents = onSnapshot(eventsQ, (snapshot) => {
            const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            events.sort((a: any, b: any) => {
                const timeA = a.created_at?.seconds || 0
                const timeB = b.created_at?.seconds || 0
                return timeB - timeA
            })
            setHostedEvents(prev => {
                if (JSON.stringify(prev) === JSON.stringify(events)) return prev;
                return events;
            })
        }, (error) => {
            console.error("Error fetching events:", error)
        })

        return () => {
            unsubscribeRsvps()
            unsubscribeEvents()
        }
    }, [user, playSound])

    const handleDeleteEvent = useCallback(async (eventId: string) => {
        const _db = db
        if (!_db) return
        if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(_db, "events", eventId))
            } catch (error) {
                console.error("Error deleting event:", error)
                alert("Failed to delete event.")
            }
        }
    }, [])

    const handleDeleteRSVP = useCallback(async (rsvpId: string) => {
        const _db = db
        if (!_db) return
        if (confirm("Are you sure you want to delete this RSVP? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(_db, "rsvps", rsvpId))
            } catch (error) {
                console.error("Error deleting RSVP:", error)
                alert("Failed to delete RSVP.")
            }
        }
    }, [])

    const navItems = [
        { id: 'transactions', label: 'Event Ledger', icon: LayoutDashboard, description: 'View RSVPs & transactions' },
        { id: 'hostings', label: 'My Events', icon: Calendar, description: 'Manage hosted events' },
        { id: 'settings', label: 'Settings', icon: Settings, description: 'Account preferences' }
    ]

    if (!user) return null

    if (!db) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Configuration Missing</h2>
                <p className="text-muted-foreground text-center max-w-md mb-8">
                    Database configuration is not set. Please check your environment variables (NEXT_PUBLIC_FIREBASE_*) and restart the application.
                </p>
                <Button onClick={() => window.location.reload()}>Retry Connection</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />

            <div className="flex">
                {/* ──────────── Refined Sidebar ──────────── */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden md:flex flex-col w-[260px] border-r border-border/60 bg-card/40 backdrop-blur-sm h-[calc(100vh-64px)] sticky top-16"
                >
                    {/* User Quick Info */}
                    <div className="p-5 border-b border-border/40">
                        <div className="flex items-center gap-3">
                            {user?.photoURL ? (
                                <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-accent/20">
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-accent" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{user?.displayName || 'Host'}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="p-4 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 px-4">Navigation</p>
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <SidebarNavItem
                                    key={item.id}
                                    item={item}
                                    isActive={activeTab === item.id}
                                    onClick={() => setActiveTab(item.id)}
                                />
                            ))}
                        </nav>
                    </div>

                    {/* Sidebar Footer - Quick Stats */}
                    <div className="p-4 border-t border-border/40">
                        <div className="glass-card rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick Stats</span>
                                <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-lg font-bold">{stats.totalPayments}</p>
                                    <p className="text-[10px] text-muted-foreground">Total RSVPs</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{hostedEvents.length}</p>
                                    <p className="text-[10px] text-muted-foreground">Events</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.aside>

                {/* ──────────── Main Content ──────────── */}
                <motion.main
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 p-5 md:p-8 space-y-6 max-w-[1400px]"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                            <p className="text-sm text-muted-foreground mt-1">Monitor your event performance and revenue</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-border/60 text-muted-foreground hover:text-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                Last 30 days
                            </Button>
                            <Button
                                onClick={() => setShowHostModal(true)}
                                size="sm"
                                className="gap-2 shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90 text-white"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Host Event</span>
                                <span className="sm:hidden">New</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* ──────────── KPI Cards ──────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Hero Metric - Total Revenue (2-column span) */}
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <motion.div
                                variants={cardHover}
                                initial="rest"
                                whileHover="hover"
                            >
                                <Card className="h-full glass-card-elevated border-border/50 overflow-hidden relative group">
                                    {/* Subtle gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-transparent pointer-events-none" />
                                    <CardContent className="p-6 relative">
                                        {loading ? (
                                            <div className="space-y-4">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-10 w-48" />
                                                <Skeleton className="h-16 w-full" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between mb-5">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Total Revenue</p>
                                                        <div className="flex items-baseline gap-3 mt-2">
                                                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                                                <AnimatedKPI
                                                                    value={stats.totalRevenue}
                                                                    prefix="₹"
                                                                    loading={loading}
                                                                />
                                                            </h2>
                                                        </div>
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 mt-3",
                                                            stats.revenueChange >= 0 ? "text-emerald-500" : "text-red-400"
                                                        )}>
                                                            {stats.revenueChange >= 0
                                                                ? <ArrowUpRight className="w-3.5 h-3.5" />
                                                                : <ArrowDownRight className="w-3.5 h-3.5" />
                                                            }
                                                            <span className="text-xs font-bold">
                                                                {Math.abs(stats.revenueChange).toFixed(1)}%
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">vs last week</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                                                        <CreditCard className="w-5 h-5 text-accent" />
                                                    </div>
                                                </div>
                                                <div className="h-16 mt-2">
                                                    <Sparkline data={sparklineData} color="hsl(221.2, 83.2%, 53.3%)" />
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>

                        {/* RSVPs Captured */}
                        <motion.div variants={itemVariants}>
                            <motion.div
                                variants={cardHover}
                                initial="rest"
                                whileHover="hover"
                            >
                                <Card className="h-full glass-card border-border/50 group">
                                    <CardContent className="p-6">
                                        {loading ? (
                                            <div className="space-y-3">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-8 w-16" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">RSVPs</p>
                                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                        <Users className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                </div>
                                                <h3 className="text-3xl font-bold tracking-tight">
                                                    <AnimatedKPI
                                                        value={stats.totalPayments}
                                                        loading={loading}
                                                    />
                                                </h3>
                                                <div className={cn(
                                                    "flex items-center gap-1.5 text-xs font-semibold mt-3",
                                                    stats.paymentsChange >= 0 ? "text-emerald-500" : "text-red-400"
                                                )}>
                                                    {stats.paymentsChange >= 0
                                                        ? <ArrowUpRight className="w-3 h-3" />
                                                        : <ArrowDownRight className="w-3 h-3" />
                                                    }
                                                    {Math.abs(stats.paymentsChange).toFixed(1)}%
                                                    <span className="text-muted-foreground font-medium">vs last week</span>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>

                        {/* Success Rate */}
                        <motion.div variants={itemVariants}>
                            <motion.div
                                variants={cardHover}
                                initial="rest"
                                whileHover="hover"
                            >
                                <Card className="h-full glass-card border-border/50 group">
                                    <CardContent className="p-6">
                                        {loading ? (
                                            <div className="space-y-3">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-8 w-16" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Check-in Rate</p>
                                                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                        <Activity className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                </div>
                                                <h3 className="text-3xl font-bold tracking-tight">
                                                    <AnimatedKPI
                                                        value={stats.successRate}
                                                        suffix="%"
                                                        decimals={1}
                                                        loading={loading}
                                                    />
                                                </h3>
                                                <div className="mt-3">
                                                    <Badge variant="success" className="text-[10px] gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                        Excellent
                                                    </Badge>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* ──────────── Revenue Chart ──────────── */}
                    <motion.div variants={itemVariants}>
                        <Card className="glass-card border-border/50 overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">Last 30 days performance</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] border-border/60 text-muted-foreground">
                                        Live
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-1.5" />
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {loading ? (
                                    <Skeleton className="h-64 w-full rounded-lg" />
                                ) : (
                                    <div className="h-64">
                                        <LineChart data={revenueChartData} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* ──────────── Data Table ──────────── */}
                    <motion.div variants={itemVariants}>
                        <Card className="glass-card border-border/50 overflow-hidden">
                            <CardHeader className="p-6 border-b border-border/40">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            {activeTab === 'hostings' ? 'My Hosted Events' : 'Recent Transactions'}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {activeTab === 'hostings' ? 'Manage your created events' : 'Latest RSVP captures in real-time'}
                                        </p>
                                    </div>
                                    {/* Tab pills for mobile */}
                                    <div className="md:hidden flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                                        {navItems.slice(0, 2).map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id)}
                                                className={cn(
                                                    "px-3 py-1.5 text-[10px] font-bold rounded-md transition-all",
                                                    activeTab === item.id
                                                        ? "bg-accent text-white"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-border/40 hover:bg-transparent">
                                                {activeTab === 'hostings' ? (
                                                    <>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Event</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Category</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Schedule</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Location</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground text-right">Actions</TableHead>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">ID</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Event</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground text-center">Status</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground text-right">Amount</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Date</TableHead>
                                                        <TableHead className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground text-right">Actions</TableHead>
                                                    </>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="px-6 py-16">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                                                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                                                            </div>
                                                            <p className="text-xs font-medium text-muted-foreground">Fetching data...</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : activeTab === 'hostings' ? (
                                                hostedEvents.length > 0 ? (
                                                    hostedEvents.map((evt, i) => (
                                                        <TableRow key={evt.id} className="dashboard-table-row border-b border-border/30 group">
                                                            <TableCell className="px-6 py-4">
                                                                <div className="font-semibold text-sm">{evt.title}</div>
                                                                <div className="text-[11px] text-muted-foreground truncate max-w-[250px] mt-0.5">{evt.description}</div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <Badge variant="success" className="gap-1.5 text-[10px]">
                                                                    <Tag className="w-3 h-3" />
                                                                    {evt.category}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    <span className="font-medium">{new Date(evt.start_time).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {evt.lat.toFixed(2)}, {evt.lng.toFixed(2)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            playSound('click')
                                                                            setSelectedBroadcastEvent(evt)
                                                                        }}
                                                                        className="w-8 h-8 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg"
                                                                        title="Send Broadcast"
                                                                    >
                                                                        <Radio className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteEvent(evt.id)}
                                                                        className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                                        title="Delete Event"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    /* ── Empty State: No Events ── */
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableCell colSpan={5} className="px-6 py-20 text-center">
                                                            <motion.div
                                                                className="flex flex-col items-center gap-4"
                                                                initial={{ opacity: 0, y: 12 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.5 }}
                                                            >
                                                                <div className="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center border border-border/40">
                                                                    <Calendar className="w-7 h-7 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm">No events yet</p>
                                                                    <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
                                                                        Create your first event to start tracking RSVPs and revenue
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    onClick={() => setShowHostModal(true)}
                                                                    size="sm"
                                                                    className="mt-1 gap-2 bg-accent hover:bg-accent/90 text-white"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Host Event
                                                                </Button>
                                                            </motion.div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            ) : (
                                                transactions.length > 0 ? (
                                                    transactions.map((tx) => (
                                                        <TableRow key={tx.id} className="border-b border-border/30 group hover:bg-accent/5 transition-colors">
                                                            <TableCell className="px-6 py-4">
                                                                <span className="text-[11px] font-mono font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-md">
                                                                    {tx.id.slice(0, 8)}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className="text-sm font-medium">
                                                                    {lookupMap[tx.event_id] || tx.event_name || `Event #${tx.event_id.slice(0, 6)}`}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-center">
                                                                {tx.checked_in_at ? (
                                                                    <Badge variant="success" className="gap-1.5 text-[10px]">
                                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                                        Checked In
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="gap-1.5 text-[10px] border-border/60 text-muted-foreground">
                                                                        <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" />
                                                                        Not Checked In
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-right">
                                                                <span className="text-sm font-semibold tabular-nums">₹499.00</span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className="text-sm text-muted-foreground tabular-nums">
                                                                    {tx.created_at?.toDate().toLocaleDateString() || "N/A"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteRSVP(tx.id)}
                                                                    className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    /* ── Empty State: No Transactions ── */
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableCell colSpan={6} className="px-6 py-20 text-center">
                                                            <motion.div
                                                                className="flex flex-col items-center gap-4"
                                                                initial={{ opacity: 0, y: 12 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.5 }}
                                                            >
                                                                <div className="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center border border-border/40">
                                                                    <Inbox className="w-7 h-7 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm">No transactions yet</p>
                                                                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
                                                                        When attendees RSVP to your events, their transactions will appear here in real-time
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </motion.div>
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                </motion.main>
            </div>

            {/* Host Event Modal */}
            <AnimatePresence>
                {showHostModal && (
                    <HostEventModal onClose={() => setShowHostModal(false)} userLocation={userLocation} />
                )}
            </AnimatePresence>
            {/* Broadcast Modal */}
            <AnimatePresence>
                {selectedBroadcastEvent && (
                    <BroadcastModal
                        event={selectedBroadcastEvent}
                        onClose={() => setSelectedBroadcastEvent(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
