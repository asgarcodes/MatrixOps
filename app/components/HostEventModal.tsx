'use client'
import { useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Clock, Plus, Loader2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export default function HostEventModal({ onClose, userLocation }: any) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const { playSound } = useAudio()
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Cultural',
        start_time: '',
        end_time: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const _db = db
        if (!user || !_db) {
            alert("Database connection or user session not found.")
            return
        }

        setLoading(true)
        playSound('click')

        try {
            await addDoc(collection(_db, "events"), {
                ...formData,
                user_id: user.uid,
                lat: userLocation?.lat || 40.7128,
                lng: userLocation?.lng || -74.0060,
                created_at: serverTimestamp()
            });
            setSuccess(true)
            playSound('success')
            setTimeout(() => {
                onClose()
                window.location.reload()
            }, 2000)
        } catch (error: any) {
            alert(error.message)
            playSound('alert')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-card rounded-[2.5rem] relative overflow-hidden border border-border shadow-2xl"
            >
                <div className="absolute top-8 right-8 z-20">
                    <button
                        onClick={() => {
                            playSound('click')
                            onClose()
                        }}
                        className="p-3 bg-background border border-border text-muted hover:text-foreground rounded-2xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-10 md:p-14 relative z-10">
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 space-y-6"
                            >
                                <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tight">Event Published</h1>
                                <p className="text-muted font-bold text-xs tracking-widest uppercase">Your event is now live in the network</p>
                            </motion.div>
                        ) : (
                            <form key="form" onSubmit={handleSubmit} className="space-y-10">
                                <header className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full w-max text-accent">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Host Protocol</span>
                                    </div>
                                    <h2 className="text-4xl font-extrabold tracking-tight leading-none">Create <br />Local Event</h2>
                                </header>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Event Title</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="What's the event name?"
                                                className="w-full bg-background border border-border rounded-xl px-5 py-4 text-sm font-medium focus:border-accent outline-none transition-all"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Description</label>
                                            <textarea
                                                required
                                                rows={4}
                                                placeholder="Provide details about the event..."
                                                className="w-full bg-background border border-border rounded-xl px-5 py-4 text-sm font-medium focus:border-accent outline-none transition-all"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Category</label>
                                            <select
                                                className="w-full bg-background border border-border rounded-xl px-5 py-4 text-sm font-medium focus:border-accent outline-none transition-all appearance-none"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            >
                                                <option value="Cultural">Cultural</option>
                                                <option value="Educational">Educational</option>
                                                <option value="Sports">Sports</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Start Time</label>
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-xs font-bold focus:border-accent outline-none transition-all"
                                                    value={formData.start_time}
                                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">End Time</label>
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-xs font-bold focus:border-accent outline-none transition-all"
                                                    value={formData.end_time}
                                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="p-5 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-4">
                                            <MapPin className="w-6 h-6 text-accent shrink-0" />
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-accent leading-relaxed">
                                                Broadcasting at: <br />
                                                Lat: {userLocation?.lat?.toFixed(4) || 'Detecting...'} Lng: {userLocation?.lng?.toFixed(4) || 'Detecting...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-16 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-xl shadow-primary/10 transition-all hover:opacity-90 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            Publish Event <Plus className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    )
}
