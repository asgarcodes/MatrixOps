'use client'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Radio, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { useAuth } from '@/context/AuthContext'

export default function BroadcastModal({ event, onClose }: any) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [message, setMessage] = useState('')
    const { playSound } = useAudio()

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || !user) return

        setLoading(true)
        playSound('click')

        try {
            await addDoc(collection(db, "broadcasts"), {
                event_id: event.id,
                organizer_id: user.uid,
                message: message.trim(),
                event_title: event.title,
                created_at: serverTimestamp(),
                type: 'urgent' // Can be expanded later
            })

            setSuccess(true)
            playSound('success')
            setTimeout(onClose, 2000)
        } catch (error: any) {
            console.error("Broadcast error:", error)
            alert("Failed to send broadcast.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden relative"
            >
                <div className="absolute top-6 right-6">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <header className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            <span>Emergency Broadcast</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Broadcast to Attendees</h2>
                        <p className="text-sm text-muted-foreground">Message will be visible to all users who have RSVP'd for <b>{event.title}</b>.</p>
                    </header>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">Signal Transmitted</p>
                            </motion.div>
                        ) : (
                            <form key="form" onSubmit={handleSend} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Message Body</label>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="e.g. The 7:00 PM session is moved to the Main Hall."
                                        className="w-full bg-background border border-border rounded-xl px-5 py-4 text-sm font-medium focus:border-red-500 outline-none transition-all resize-none"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <div className="flex justify-end pt-1">
                                        <span className="text-[10px] text-muted-foreground font-medium">{message.length}/280 characters</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !message.trim()}
                                    className="w-full h-14 bg-red-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-red-500/20 transition-all hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Protocol Update</>}
                                </button>
                            </form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    )
}
