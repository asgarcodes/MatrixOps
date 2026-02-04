'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Navbar from '@/components/Navbar'
import {
  MapPin, Calendar, Clock, ArrowRight, Activity, Users,
  RefreshCw, ChevronRight, Navigation, Search as SearchIcon,
  BookOpen, Music, Trophy, Filter, Globe, Zap
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import EventModal from '@/components/EventModal'
import { seedFirestoreData } from '@/lib/seed'
import { useAudio } from '@/hooks/useAudio'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'Cultural', 'Educational', 'Sports']

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const { user } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const { playSound } = useAudio()

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      })
    }

    const fetchData = async () => {
      const q = query(collection(db, "events"), orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
    }
    fetchData();
  }, [])

  const filteredEvents = events
    .filter(event => {
      const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .map(event => {
      if (userLocation) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng);
        return { ...event, distance: dist };
      }
      return event;
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Educational': return <BookOpen className="w-4 h-4" />;
      case 'Cultural': return <Music className="w-4 h-4" />;
      case 'Sports': return <Trophy className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 font-sans antialiased">
      <Navbar />

      {/* Classic Professional Hero */}
      <section className="relative pt-40 pb-24 overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                <Globe className="w-3.5 h-3.5" />
                <span>Real-time local discovery hub</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Discover events <br />
                <span className="text-accent underline decoration-accent/20 decoration-8 underline-offset-8">happening now</span> <br />
                near you.
              </h1>

              <p className="text-xl text-muted font-medium leading-relaxed max-w-2xl">
                The most professional platform to explore, RSVP, and host local cultural, educational, and sports events in your community.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/map"
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/10 flex items-center gap-2"
                >
                  Explore Local Map <Navigation className="w-4 h-4" />
                </Link>
                <Link
                  href="/scan"
                  className="px-8 py-4 bg-background border border-border text-foreground rounded-xl font-bold text-sm transition-all hover:bg-card flex items-center gap-2"
                >
                  Check In via QR <Zap className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playSound('click')
                  setSelectedCategory(cat)
                }}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "text-muted hover:text-foreground hover:bg-card border border-transparent hover:border-border"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative group w-full md:w-96">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-colors group-focus-within:text-accent" />
            <input
              type="text"
              placeholder="Search events, locations, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-6 py-3 bg-card border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Discovery Feed */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userLocation ? (
            filteredEvents.length > 0 ? (
              filteredEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    playSound('click')
                    setSelectedEvent(event)
                  }}
                  className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-accent/5 transition-all cursor-pointer relative"
                >
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-accent/5 rounded-2xl flex items-center justify-center text-accent">
                        {getCategoryIcon(event.category)}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="px-3 py-1 bg-accent text-white rounded-full text-[10px] font-bold">
                          {event.distance?.toFixed(1)} km away
                        </span>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">{event.title}</h3>
                      <p className="text-sm text-muted font-medium line-clamp-2 leading-relaxed">{event.description}</p>
                    </div>

                    <div className="pt-6 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-accent font-bold text-xs">
                        Details <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-border rounded-[3rem] bg-card/50">
                <Filter className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No events found</h3>
                <p className="text-muted font-medium">Try adjusting your filters or search query.</p>
              </div>
            )
          ) : (
            <div className="col-span-full py-40 flex flex-col items-center justify-center bg-card rounded-[3rem] border border-border">
              <RefreshCw className="w-12 h-12 text-accent animate-spin mb-6" />
              <p className="text-sm font-bold text-muted animate-pulse">Scanning local sectors for active events...</p>
            </div>
          )}
        </div>

        <div className="mt-20 text-center">
          <button
            onClick={() => {
              playSound('click')
              seedFirestoreData(userLocation?.lat, userLocation?.lng)
            }}
            className="px-8 py-3 bg-card border border-border rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-accent/5 transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Sync Local Database
          </button>
        </div>
      </section>

      {/* Classic Footer */}
      <footer className="bg-card border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black">M</div>
                <span className="text-2xl font-bold tracking-tight">MatrixOps</span>
              </div>
              <p className="text-muted font-medium leading-relaxed max-w-sm">
                A professional ecosystem for discovering and organizing localized synchronization events. Building community through optimized discovery.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Discover</h4>
              <ul className="space-y-3 text-sm font-medium text-muted">
                <li><Link href="/map" className="hover:text-accent">Global Map</Link></li>
                <li><Link href="/scan" className="hover:text-accent">Event Check-in</Link></li>
                <li><Link href="/dashboard" className="hover:text-accent">Host Control</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm font-medium text-muted">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Sync</li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-muted">
            <p>© 2026 MatrixOps Global Protocol. All sectors reserved.</p>
            <div className="flex gap-8">
              <span>Status: Operational</span>
              <span>Regional Hub: Sector 01</span>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
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
