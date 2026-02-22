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
    Activity, Plus, MapPin, Calendar, Clock, Tag, Radio
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

const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
        }
    }
}

// Generate realistic sample data for charts
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

    // Generate chart data
    const revenueChartData = useMemo(() => generateRevenueData(), [])
    const sparklineData = useMemo(() => revenueChartData.slice(-7).map(d => d.value), [revenueChartData])

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            })
        }
    }, [])

    useEffect(() => {
        if (!user) return

        setLoading(true)

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

            setTransactions(allRsvps.slice(0, 10))

            // Calculate stats based on host's RSVPs
            const totalRev = allRsvps.length * 499
            const checkedInCount = allRsvps.filter((r: any) => r.checked_in_at).length

            setStats(prev => ({
                ...prev,
                totalRevenue: totalRev,
                totalPayments: allRsvps.length,
                successRate: allRsvps.length > 0 ? parseFloat(((checkedInCount / allRsvps.length) * 100).toFixed(1)) : 0
            }))
            setLoading(false)
        }, (error) => {
            console.error("Error fetching transactions:", error)
            setLoading(false)
        })

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
            setHostedEvents(events)
        }, (error) => {
            console.error("Error fetching events:", error)
        })

        return () => {
            unsubscribeRsvps()
            unsubscribeEvents()
        }
    }, [user])

    const handleDeleteEvent = useCallback(async (eventId: string) => {
        if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "events", eventId))
            } catch (error) {
                console.error("Error deleting event:", error)
                alert("Failed to delete event.")
            }
        }
    }, [])

    const handleDeleteRSVP = useCallback(async (rsvpId: string) => {
        if (confirm("Are you sure you want to delete this RSVP? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "rsvps", rsvpId))
            } catch (error) {
                console.error("Error deleting RSVP:", error)
                alert("Failed to delete RSVP.")
            }
        }
    }, [])

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <Navbar />

            <div className="flex">
                {/* Refined Sidebar */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/30 backdrop-blur-sm h-[calc(100vh-64px)] sticky top-16"
                >
                    <div className="p-6">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Navigation</h2>
                        <nav className="space-y-1">
                            {[
                                { id: 'transactions', label: 'Event Ledger', icon: LayoutDashboard },
                                { id: 'hostings', label: 'My Events', icon: Calendar },
                                { id: 'settings', label: 'Settings', icon: Settings }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden",
                                        activeTab === item.id
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                    )}
                                >
                                    {activeTab === item.id && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                        />
                                    )}
                                    <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === item.id && "text-primary")} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </motion.aside>

                {/* Main Content */}
                <motion.main
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex-1 p-6 md:p-8 space-y-8 max-w-[1600px]"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                            <p className="text-sm text-muted-foreground mt-1">Monitor your event performance and revenue</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                                <Calendar className="w-4 h-4" />
                                Last 30 days
                            </Button>
                            <Button
                                onClick={() => setShowHostModal(true)}
                                size="sm"
                                className="gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Host Event</span>
                                <span className="sm:hidden">New</span>
                            </Button>
                        </div>
                    </motion.div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Hero Metric - Total Revenue */}
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <Card className="h-full bg-gradient-to-br from-card to-card/50 border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all group overflow-hidden relative">
                                <CardContent className="p-6">
                                    {loading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-10 w-48" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
                                                    <div className="flex items-baseline gap-3 mt-2">
                                                        <h2 className="text-4xl font-bold">₹{stats.totalRevenue.toLocaleString()}</h2>
                                                        <Badge variant={stats.revenueChange >= 0 ? "success" : "destructive"} className="gap-1">
                                                            {stats.revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                            {Math.abs(stats.revenueChange).toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    <CreditCard className="w-6 h-6 text-primary" />
                                                </div>
                                            </div>
                                            <div className="h-16 mt-4">
                                                <Sparkline data={sparklineData} color="rgb(59, 130, 246)" />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">vs. last week</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* RSVPs Captured */}
                        <motion.div variants={itemVariants}>
                            <Card className="h-full border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                                <CardContent className="p-6">
                                    {loading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-8 w-16" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RSVPs</p>
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-3xl font-bold">{stats.totalPayments}</h3>
                                            <div className={cn(
                                                "flex items-center gap-1 text-xs font-semibold mt-2",
                                                stats.paymentsChange >= 0 ? "text-emerald-600" : "text-red-600"
                                            )}>
                                                {stats.paymentsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {Math.abs(stats.paymentsChange).toFixed(1)}% vs last week
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Success Rate */}
                        <motion.div variants={itemVariants}>
                            <Card className="h-full border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                                <CardContent className="p-6">
                                    {loading ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-8 w-16" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Success Rate</p>
                                                <Activity className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-3xl font-bold">{stats.successRate}%</h3>
                                            <Badge variant="success" className="mt-2">Excellent performance</Badge>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Revenue Chart */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                                <p className="text-sm text-muted-foreground">Last 30 days performance</p>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-64 w-full" />
                                ) : (
                                    <div className="h-64">
                                        <LineChart data={revenueChartData} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Data Table */}
                    <motion.div variants={itemVariants}>
                        <Card className="border-border/50 overflow-hidden">
                            <CardHeader className="p-6 border-b border-border/50">
                                <CardTitle className="text-lg">
                                    {activeTab === 'hostings' ? 'My Hosted Events' : 'Recent Transactions'}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {activeTab === 'hostings' ? 'Manage your created events' : 'Latest RSVP captures'}
                                </p>
                            </CardHeader>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                                                {activeTab === 'hostings' ? (
                                                    <>
                                                        <TableHead className="px-6 py-4">Event</TableHead>
                                                        <TableHead className="px-6 py-4">Category</TableHead>
                                                        <TableHead className="px-6 py-4">Schedule</TableHead>
                                                        <TableHead className="px-6 py-4">Location</TableHead>
                                                        <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableHead className="px-6 py-4">ID</TableHead>
                                                        <TableHead className="px-6 py-4">Event</TableHead>
                                                        <TableHead className="px-6 py-4">Status</TableHead>
                                                        <TableHead className="px-6 py-4">Amount</TableHead>
                                                        <TableHead className="px-6 py-4">Date</TableHead>
                                                        <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                                                    </>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-border/30">
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="px-6 py-12">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                                            <p className="text-sm text-muted-foreground">Loading data...</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : activeTab === 'hostings' ? (
                                                hostedEvents.length > 0 ? (
                                                    hostedEvents.map((evt) => (
                                                        <TableRow key={evt.id} className="hover:bg-accent/30 transition-colors group">
                                                            <TableCell className="px-6 py-4">
                                                                <div className="font-semibold text-sm">{evt.title}</div>
                                                                <div className="text-xs text-muted-foreground truncate max-w-[250px]">{evt.description}</div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <Badge variant="success" className="gap-1.5">
                                                                    <Tag className="w-3 h-3" />
                                                                    {evt.category}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    <span className="font-medium">{new Date(evt.start_time).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {evt.lat.toFixed(2)}, {evt.lng.toFixed(2)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            playSound('click')
                                                                            setSelectedBroadcastEvent(evt)
                                                                        }}
                                                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                                        title="Send Broadcast"
                                                                    >
                                                                        <Radio className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteEvent(evt.id)}
                                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                        title="Delete Event"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="px-6 py-16 text-center">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                                                                    <Calendar className="w-8 h-8 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm">No events yet</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">Create your first event to get started</p>
                                                                </div>
                                                                <Button
                                                                    onClick={() => setShowHostModal(true)}
                                                                    size="sm"
                                                                    className="mt-2"
                                                                >
                                                                    Host Event
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            ) : (
                                                transactions.length > 0 ? (
                                                    transactions.map((tx) => (
                                                        <TableRow key={tx.id} className="hover:bg-accent/30 transition-colors group">
                                                            <TableCell className="px-6 py-4">
                                                                <code className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                                                    {tx.id.slice(0, 8)}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className="text-sm font-medium">Event #{tx.event_id.slice(0, 6)}</span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                {tx.checked_in_at ? (
                                                                    <Badge variant="success" className="gap-1.5">
                                                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                                                        Checked In
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="gap-1.5 opacity-60">
                                                                        <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                                                                        Paid
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className="text-sm font-semibold">₹499.00</span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4">
                                                                <span className="text-sm text-muted-foreground">
                                                                    {tx.created_at?.toDate().toLocaleDateString()}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="px-6 py-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteRSVP(tx.id)}
                                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="px-6 py-16 text-center">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center">
                                                                    <Repeat className="w-8 h-8 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm">No transactions found</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">Your RSVPs will appear here</p>
                                                                </div>
                                                            </div>
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
