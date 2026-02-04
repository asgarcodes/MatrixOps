'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import EventModal from '@/components/EventModal'
import { useAuth } from '@/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Map as MapIcon, Globe } from 'lucide-react'

const EventMap = dynamic(() => import('@/components/EventMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0a0a0a] rounded-3xl flex items-center justify-center border border-white/5">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Warping Sector...</span>
            </div>
        </div>
    )
})

export default function MapPage() {
    const [events, setEvents] = useState<any[]>([])
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const { user } = useAuth()

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "events"));
                const eventsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEvents(eventsData)
            } catch (error) {
                console.error("Error fetching events:", error)
            }
        }
        fetchEvents()

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude])
                },
                (error) => {
                    console.error("Error getting location:", error)
                }
            )
        }
    }, [])

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <Navbar />
            <main className="pt-24 h-screen px-6 pb-6">
                <div className="w-full h-full glass-card rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl">
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Vector active</span>
                        </div>
                    </div>
                    <EventMap
                        events={events}
                        userLocation={userLocation}
                        onEventSelect={setSelectedEvent}
                    />
                </div>
            </main>

            <AnimatePresence mode="wait">
                {selectedEvent && (
                    <EventModal
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                        userId={user?.uid}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
