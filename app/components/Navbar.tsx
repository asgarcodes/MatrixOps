'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Scan, LogOut, User, Map as MapIcon, Loader2, Sparkles, LayoutDashboard, Search, Navigation, Globe } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function Navbar() {
    const { user } = useAuth()
    const [isSigningOut, setIsSigningOut] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    const isDashboard = pathname.startsWith('/dashboard')

    const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
            await signOut(auth)
            // Add a deliberate delay for the Accenture animation effect
            await new Promise(resolve => setTimeout(resolve, 2000))
            setIsSigningOut(false)
            router.push('/')
        } catch (error) {
            console.error("Logout error:", error)
            setIsSigningOut(false)
        }
    }

    if (isDashboard) return null;

    return (
        <>
            <AnimatePresence>
                {isSigningOut && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 backdrop-blur-2xl"
                    >
                        {/* Accenture-inspired geometric background elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"
                            />
                            <motion.div
                                initial={{ y: '-100%' }}
                                animate={{ y: '100%' }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                                className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent"
                            />
                        </div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 1.05, opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="text-center space-y-8 relative z-10"
                        >
                            <div className="relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: 64 }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                    className="h-1 bg-accent mx-auto mb-8"
                                />
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-extrabold tracking-tightest leading-none flex items-center justify-center gap-4">
                                        Confirmed <span className="text-accent underline decoration-accent/20 decoration-4 underline-offset-8">Sign Out</span>
                                        <span className="text-accent text-5xl font-light opacity-50">&gt;</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted pt-4">Terminating secure session...</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scaleY: [1, 2, 1],
                                            opacity: [0.3, 1, 0.3]
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                        className="w-1 h-4 bg-accent/40 rounded-full"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-black text-sm group-hover:bg-accent transition-colors">M</div>
                        <span className="text-xl font-bold tracking-tight flex items-center">MatrixOps <span className="text-accent ml-1 opacity-0 group-hover:opacity-100 transition-opacity font-light">&gt;</span></span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/map" className={cn("text-xs font-bold uppercase tracking-widest transition-colors", pathname === '/map' ? "text-accent" : "text-muted hover:text-foreground")}>Map View</Link>
                        <Link href="/scan" className={cn("text-xs font-bold uppercase tracking-widest transition-colors", pathname === '/scan' ? "text-accent" : "text-muted hover:text-foreground")}>Check-in hub</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="text-xs font-bold text-muted hover:text-accent flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 bg-card border border-border rounded-lg hover:bg-accent/5 transition-all transition-all group"
                                >
                                    {user.photoURL ? (
                                        <div className="w-6 h-6 rounded-md overflow-hidden bg-card border border-border">
                                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    <span className="text-[10px] font-bold text-muted group-hover:text-foreground">Exit</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-5 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-lg shadow-primary/10"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </header>
        </>
    )
}
