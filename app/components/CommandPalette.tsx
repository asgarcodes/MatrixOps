'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Map, Scan, LayoutDashboard, Terminal, X, Zap, Globe, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    const items = [
        { id: 'map', title: 'Global Event Map', icon: Map, path: '/map', description: 'View all active nodes in the matrix' },
        { id: 'scan', title: 'Ticket Scanner', icon: Scan, path: '/scan', description: 'Initialize entry verification protocol' },
        { id: 'dashboard', title: 'Admin Dashboard', icon: LayoutDashboard, path: '/dashboard', description: 'Network throughput and node management' },
        { id: 'login', title: 'Identity Portal', icon: Shield, path: '/login', description: 'Authorize access to encrypted sectors' },
        { id: 'home', title: 'Matrix Core', icon: Globe, path: '/', description: 'Return to central synchronization hub' },
    ]

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    )

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(prev => !prev)
            }
            if (e.key === 'Escape') setIsOpen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (isOpen) {
            setQuery('')
            setSelectedIndex(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleSelect = (path: string) => {
        router.push(path)
        setIsOpen(false)
    }

    const playClick = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.1)

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden"
                    >
                        <div className="flex items-center px-4 border-b border-white/5 bg-white/[0.02]">
                            <Terminal className="w-5 h-5 text-blue-500 mr-3" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    setSelectedIndex(0)
                                }}
                                placeholder="Execute command or search nodes..."
                                className="w-full py-4 bg-transparent outline-none text-white placeholder-gray-600 text-sm font-medium"
                            />
                            <div className="flex items-center gap-1.5 ml-4">
                                <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-gray-400 font-bold uppercase">Esc</span>
                                <span className="text-[10px] text-gray-600 font-bold">to close</span>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                            {filteredItems.length > 0 ? (
                                <div className="space-y-1">
                                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">System Shortcuts</div>
                                    {filteredItems.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                playClick()
                                                handleSelect(item.path)
                                            }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedIndex === index ? 'bg-blue-600/10 border-blue-500/20 text-white translate-x-1' : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5'
                                                } border text-left group`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${selectedIndex === index ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{item.title}</div>
                                                    <div className="text-[10px] text-gray-500 font-medium">{item.description}</div>
                                                </div>
                                            </div>
                                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedIndex === index ? 'opacity-100' : ''}`}>
                                                <Zap className="w-3 h-3 text-blue-500" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center space-y-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                                        <X className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-gray-400">Command Not Found</p>
                                        <p className="text-xs text-gray-600">No protocol matching "{query}" exists in core memory.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-gray-500 font-bold uppercase">↑↓</span>
                                    <span className="text-[10px] text-gray-600 font-bold">Navigate</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-gray-500 font-bold uppercase">Enter</span>
                                    <span className="text-[10px] text-gray-600 font-bold">Select</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-black italic text-blue-500 uppercase tracking-tighter animate-pulse">
                                System Active
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
