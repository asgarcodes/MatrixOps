'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle2, XCircle, RefreshCw, ChevronLeft,
    ShieldCheck, Activity, Camera, Maximize, Upload,
    Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ScanPage() {
    const [scanResult, setScanResult] = useState<{
        status: 'success' | 'error' | 'processing',
        message: string,
        time?: string,
        eventTitle?: string
    } | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera')
    const [uploading, setUploading] = useState(false)
    const html5QrCode = useRef<Html5Qrcode | null>(null)

    const handleCheckIn = async (qrData: string) => {
        setScanResult({ status: 'processing', message: 'Verifying Ticket...' })

        const [rsvpId] = qrData.split('|')

        const _db = db
        if (!_db) {
            setScanResult({ status: 'error', message: 'Database Connection Lost' })
            return
        }

        try {
            if (rsvpId.startsWith('MOCK-')) {
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                setScanResult({
                    status: 'success',
                    message: 'Ticket Confirmed',
                    eventTitle: 'Matrix Demonstration Event',
                    time
                })
                return
            }

            const rsvpRef = doc(_db, "rsvps", rsvpId)
            const rsvpSnap = await getDoc(rsvpRef)

            if (!rsvpSnap.exists()) {
                setScanResult({ status: 'error', message: 'Invalid or Expired Ticket' })
                return
            }

            const rsvpData = rsvpSnap.data()

            if (rsvpData.checked_in_at) {
                setScanResult({
                    status: 'error',
                    message: 'Already Checked In',
                    time: rsvpData.checked_in_at.toDate ? rsvpData.checked_in_at.toDate().toLocaleTimeString() : 'Previously'
                })
                return
            }

            const eventRef = doc(_db, "events", rsvpData.event_id)
            const eventSnap = await getDoc(eventRef)
            const eventTitle = eventSnap.exists() ? eventSnap.data().title : 'Registered Event'

            const checkInTime = new Date()
            await updateDoc(rsvpRef, {
                checked_in_at: checkInTime
            })

            setScanResult({
                status: 'success',
                message: 'Ticket Confirmed',
                eventTitle: eventTitle,
                time: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            })

        } catch (error: any) {
            console.error("Check-in error:", error)
            setScanResult({ status: 'error', message: 'Verification Failed' })
        }
    }

    const startCamera = async () => {
        setIsScanning(true)
        setScanResult(null)
        setScanMode('camera')

        try {
            const scanner = new Html5Qrcode("reader")
            html5QrCode.current = scanner

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 15,
                    qrbox: { width: 280, height: 280 },
                },
                (decodedText) => {
                    stopCamera()
                    handleCheckIn(decodedText)
                },
                (errorMessage) => { /* scanning */ }
            )
        } catch (err) {
            console.error("Camera access error:", err)
            setIsScanning(false)
        }
    }

    const stopCamera = async () => {
        if (html5QrCode.current) {
            try {
                await html5QrCode.current.stop()
                html5QrCode.current = null
            } catch (err) {
                console.error("Stop camera error:", err)
            }
        }
        setIsScanning(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setScanResult(null)

        // We need a temporary element to initialize Html5Qrcode for file scanning
        const scanner = new Html5Qrcode("reader-hidden")
        try {
            const decodedText = await scanner.scanFile(file, true)
            handleCheckIn(decodedText)
        } catch (err) {
            setScanResult({ status: 'error', message: 'Could not detect QR code in image' })
        } finally {
            setUploading(false)
            scanner.clear()
        }
    }

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent/20">
            <Navbar />

            <div className="pt-40 pb-24 px-6 max-w-2xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest mx-auto">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorized Point-of-Entry</span>
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight">Access Control</h1>
                    <p className="text-muted font-medium">Position QR code or upload a ticket for instant verification.</p>
                </header>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => { stopCamera(); setScanMode('camera'); setScanResult(null); }}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            scanMode === 'camera' ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted border-border hover:text-foreground"
                        )}
                    >
                        Camera Mode
                    </button>
                    <button
                        onClick={() => { stopCamera(); setScanMode('upload'); setScanResult(null); }}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            scanMode === 'upload' ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted border-border hover:text-foreground"
                        )}
                    >
                        Upload Mode
                    </button>
                </div>

                {/* Main Scanning Card */}
                <div className="relative bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-accent/5">
                    <div className="relative aspect-square md:aspect-[4/3] bg-black flex items-center justify-center">
                        <div id="reader" className={cn("w-full h-full", scanMode === 'camera' ? "block" : "hidden")}></div>
                        <div id="reader-hidden" className="hidden"></div>

                        {/* Camera Interaction Overlay */}
                        {scanMode === 'camera' && !isScanning && !scanResult && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/90 backdrop-blur-sm p-10 text-center space-y-8">
                                <div className="w-24 h-24 bg-accent/5 rounded-3xl flex items-center justify-center border border-accent/10 mx-auto">
                                    <Camera className="w-10 h-10 text-accent" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">Launch Scanner</h3>
                                    <p className="text-muted text-sm font-medium">Camera access is required for ticket verification.</p>
                                </div>
                                <button
                                    onClick={startCamera}
                                    className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 mx-auto"
                                >
                                    <Maximize className="w-5 h-5" /> Start Recording
                                </button>
                            </div>
                        )}

                        {/* Upload Mode UI */}
                        {scanMode === 'upload' && !scanResult && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card p-10 text-center space-y-8">
                                <div className="w-24 h-24 bg-accent/5 rounded-3xl flex items-center justify-center border border-accent/10 mx-auto">
                                    <ImageIcon className="w-10 h-10 text-accent" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">Upload Ticket</h3>
                                    <p className="text-muted text-sm font-medium">Select a QR code image from your device.</p>
                                </div>
                                <label className="px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 cursor-pointer">
                                    {uploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                    {uploading ? "Analyzing..." : "Choose File"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        )}

                        {/* UPI-inspired scanner box */}
                        <AnimatePresence>
                            {isScanning && (
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[280px] h-[280px] border-2 border-white/20 rounded-3xl relative">
                                            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl" />
                                            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl" />
                                            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl" />
                                            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl" />
                                            <motion.div
                                                animate={{
                                                    top: ["0%", "100%", "0%"],
                                                    opacity: [0.3, 1, 0.3]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_rgba(37,99,235,0.8)] z-20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Result UI Overlay */}
                        <AnimatePresence>
                            {scanResult && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-card p-10 text-center"
                                >
                                    {scanResult.status === 'processing' ? (
                                        <div className="space-y-6">
                                            <RefreshCw className="w-16 h-16 text-accent animate-spin mx-auto" />
                                            <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">{scanResult.message}</p>
                                        </div>
                                    ) : scanResult.status === 'success' ? (
                                        <div className="space-y-8">
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                                                <CheckCircle2 className="w-12 h-12 text-white" />
                                            </motion.div>
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-extrabold text-emerald-600">{scanResult.message}</h2>
                                                {scanResult.eventTitle && <p className="text-lg font-bold text-foreground">{scanResult.eventTitle}</p>}
                                                <div className="flex items-center justify-center gap-4 py-3 px-6 bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-500/20 rounded-2xl w-max mx-auto">
                                                    <Activity className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Verified at: {scanResult.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-500/20">
                                                <XCircle className="w-12 h-12 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-3xl font-extrabold text-red-600">{scanResult.message}</h2>
                                                {scanResult.time && <p className="text-xs font-bold text-muted uppercase tracking-widest">Logged: {scanResult.time}</p>}
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setScanResult(null); if (scanMode === 'camera') startCamera(); }}
                                        className="mt-12 px-8 py-3 bg-background border border-border rounded-xl text-xs font-bold text-muted hover:text-foreground transition-all"
                                    >
                                        Scan Next Ticket
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-muted px-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="uppercase tracking-widest">Live Firebase Uplink</span>
                    </div>
                    <Link href="/" className="flex items-center gap-2 hover:text-foreground transition-colors group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Exit to Feed
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                #reader video { 
                    width: 100% !important; 
                    height: 100% !important; 
                    object-fit: cover !important; 
                    border-radius: 0 !important;
                }
                #reader__scan_region {
                    display: none !important;
                }
                #reader__dashboard_section_csr {
                    display: none !important;
                }
            `}</style>
        </div>
    )
}
