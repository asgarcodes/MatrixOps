'use client'
import { QRCodeSVG } from 'qrcode.react'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Calendar, MapPin, Clock, Ticket, CheckCircle2,
    Loader2, Sparkles, ShieldCheck, DollarSign, Activity,
    ChevronRight, Zap, Target, Share2, Copy, Check, Radio, Bell
} from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import PaymentModal from './PaymentModal'
import { cn } from '@/lib/utils'

export default function EventModal({ event, onClose, userId }: any) {
    const [rsvp, setRsvp] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [showPayment, setShowPayment] = useState(false)
    const [qrValue, setQrValue] = useState('')
    const [copied, setCopied] = useState(false)
    const [broadcasts, setBroadcasts] = useState<any[]>([])
    const [newBroadcastPulse, setNewBroadcastPulse] = useState(false)
    const { playSound } = useAudio()

    useEffect(() => {
        if (userId && event) {
            checkRsvp()
        }
    }, [userId, event])

    useEffect(() => {
        const _db = db
        if (!_db) return

        const q = query(
            collection(_db, "broadcasts"),
            where("event_id", "==", event.id)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allBroadcasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

            // Detect if a new broadcast was added (not just initial load)
            const hasNewDoc = snapshot.docChanges().some(change => change.type === "added")
            const isInitialLoad = snapshot.metadata.fromCache || snapshot.docs.length === snapshot.docChanges().length

            if (hasNewDoc && !isInitialLoad) {
                playSound('alert')
                setNewBroadcastPulse(true)
                setTimeout(() => setNewBroadcastPulse(false), 3000)
            }

            // Client-side sort to avoid requiring a composite index
            allBroadcasts.sort((a, b) => {
                const timeA = b.created_at?.seconds || 0
                const timeB = a.created_at?.seconds || 0
                return timeA - timeB
            })

            setBroadcasts(allBroadcasts.slice(0, 3))
        })

        return () => unsubscribe()
    }, [event?.id])

    const checkRsvp = async () => {
        const _db = db
        if (!_db) return
        try {
            const q = query(
                collection(_db, "rsvps"),
                where("user_id", "==", userId),
                where("event_id", "==", event.id)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setRsvp({
                    id: querySnapshot.docs[0].id,
                    ...querySnapshot.docs[0].data()
                });
            }
        } catch (error) {
            console.error("Error checking RSVP:", error)
        }
    }

    useEffect(() => {
        if (rsvp) {
            const updateQR = () => {
                const timestamp = Math.floor(Date.now() / 60000)
                setQrValue(`${rsvp.id}|${timestamp}`)
            }
            updateQR()
            const interval = setInterval(updateQR, 10000)
            return () => clearInterval(interval)
        }
    }, [rsvp])

    const handleRSVP = () => {
        if (!userId) {
            alert('Please login to RSVP')
            return
        }
        setShowPayment(true)
        playSound('click')
    }

    const completeBooking = async () => {
        const _db = db
        if (!_db) {
            alert("Database connection not established.")
            return
        }
        setLoading(true)
        try {
            const docRef = await addDoc(collection(_db, "rsvps"), {
                user_id: userId,
                event_id: event.id,
                organizer_id: event.user_id, // Link to the event creator for host dashboard
                checked_in_at: null,
                created_at: serverTimestamp()
            });
            setRsvp({
                id: docRef.id,
                user_id: userId,
                event_id: event.id,
                organizer_id: event.user_id,
                checked_in_at: null
            });
            playSound('success')
            setShowPayment(false)
        } catch (error: any) {
            alert(error.message)
            playSound('alert')
        } finally {
            setLoading(false)
        }
    }

    const handleShare = async () => {
        playSound('click')
        const shareData = {
            title: event.title,
            text: event.description,
            url: window.location.origin + '?event=' + event.id
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                console.log('Share cancelled')
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareData.url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-xl bg-card rounded-[2.5rem] relative overflow-hidden border border-border shadow-2xl shadow-accent/5"
            >
                <div className="absolute top-6 right-6 z-20 flex gap-2">
                    <button
                        onClick={handleShare}
                        className="p-2.5 bg-background border border-border text-muted hover:text-accent rounded-xl transition-all active:scale-95 flex items-center gap-2 group"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden group-hover:inline">{copied ? 'Copied' : 'Share'}</span>
                    </button>
                    <button
                        onClick={() => {
                            playSound('click')
                            onClose()
                        }}
                        className="p-2.5 bg-background border border-border text-muted hover:text-foreground rounded-xl transition-all active:scale-95"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-10 md:p-12 space-y-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest">
                            {event.category} Event
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                            {event.title}
                        </h2>
                    </div>

                    <p className="text-lg text-muted font-medium leading-relaxed">
                        {event.description}
                    </p>

                    {/* Real-time Broadcasts Section */}
                    {broadcasts.length > 0 && (
                        <div className={cn(
                            "space-y-4 p-1 rounded-[2rem] transition-all duration-1000",
                            newBroadcastPulse ? "bg-red-500/10 shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)] ring-1 ring-red-500/20" : ""
                        )}>
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                                    <span>Live Protocol Updates</span>
                                </div>
                                <AnimatePresence>
                                    {newBroadcastPulse && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-md animate-bounce"
                                        >
                                            NEW SIGNAL
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="space-y-3">
                                {broadcasts.map((b) => (
                                    <motion.div
                                        key={b.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-5 bg-card border border-red-500/10 rounded-2xl flex gap-4 shadow-sm"
                                    >
                                        <Bell className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-foreground leading-snug">{b.message}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">
                                                {b.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-background border border-border flex items-center gap-4 transition-all">
                            <div className="w-10 h-10 bg-accent/5 text-accent rounded-xl flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Date</p>
                                <p className="text-sm font-bold">{new Date(event.start_time).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-background border border-border flex items-center gap-4 transition-all">
                            <div className="w-10 h-10 bg-accent/5 text-accent rounded-xl flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Time</p>
                                <p className="text-sm font-bold">{new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            {rsvp ? (
                                <motion.div
                                    key="rsvp-success"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full space-y-8"
                                >
                                    <div className="relative group mx-auto w-max">
                                        <div className="absolute -inset-4 bg-accent/10 rounded-[2.5rem] blur-2xl opacity-50" />
                                        <div className="relative p-6 bg-white rounded-3xl shadow-xl overflow-hidden border-8 border-white">
                                            <QRCodeSVG
                                                value={qrValue}
                                                size={160}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 text-center">
                                        <div className="inline-flex items-center gap-2 bg-emerald-600/10 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-600/20 text-[10px] font-bold uppercase tracking-widest">
                                            Confirmed Entrance
                                        </div>
                                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                                            ID: {rsvp.id.slice(0, 12)}...
                                        </p>
                                        <button
                                            onClick={onClose}
                                            className="text-[10px] font-bold text-accent hover:underline uppercase tracking-widest block mx-auto pt-4"
                                        >
                                            Return to Discovery
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleRSVP}
                                    disabled={loading}
                                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/10 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            RSVP Now <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {showPayment && (
                    <PaymentModal
                        event={event}
                        amount={499}
                        onSuccess={completeBooking}
                        onClose={() => setShowPayment(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}
