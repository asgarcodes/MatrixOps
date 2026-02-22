'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, CreditCard, CheckCircle, Lock, ShieldCheck,
    ArrowLeft, ChevronRight, Phone, Mail, Loader2, Info,
    Activity, Globe
} from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { cn } from '@/lib/utils'

import { createPaymentIntent } from '@/lib/payments'

interface PaymentModalProps {
    event: any
    amount: number
    onSuccess: () => void
    onClose: () => void
}

type Step = 'contact' | 'intent' | 'method' | 'processing' | 'success'

export default function PaymentModal({ event, amount, onSuccess, onClose }: PaymentModalProps) {
    const [step, setStep] = useState<Step>('contact')
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
    const [intent, setIntent] = useState<any>(null)
    const { playSound } = useAudio()
    const [contactInfo, setContactInfo] = useState({ email: '', phone: '' })

    const handleNext = async () => {
        if (!contactInfo.email || !contactInfo.phone) {
            alert('Please enter your contact details')
            return
        }
        playSound('click')
        setStep('intent')

        // Initialize Real Intent
        try {
            const newIntent = await createPaymentIntent(amount)
            setIntent(newIntent)
            setStep('method')
        } catch (error) {
            console.error("Payment Init Failed", error)
            alert("Payment Gateway unreachable. Please check your connection.")
            setStep('contact')
        }
    }

    const selectMethod = (method: string) => {
        playSound('click')
        setPaymentMethod(method)
        setStep('processing')
    }

    useEffect(() => {
        if (step === 'processing') {
            const timer = setTimeout(() => {
                setStep('success')
                playSound('success')
            }, 3500) // Increased for "Realism"
            return () => clearTimeout(timer)
        }
    }, [step])

    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => {
                onSuccess()
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [step])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-[420px] bg-card rounded-[2rem] overflow-hidden shadow-2xl border border-border text-foreground font-sans relative z-10"
            >
                {/* Header */}
                <div className="bg-primary px-8 py-8 text-primary-foreground relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80">Secure Checkout</h3>
                            <p className="text-xl font-extrabold tracking-tight">{event.title}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Amount */}
                <div className="px-8 py-4 bg-background border-b border-border flex justify-between items-center group">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Total Amount</span>
                        <span className="text-xl font-bold">₹{amount.toLocaleString('en-IN')}.00</span>
                    </div>
                    <div className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20 flex items-center gap-2">
                        <Lock className="w-3 h-3 text-accent" />
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Encrypted</span>
                    </div>
                </div>

                <div className="p-8 min-h-[340px] flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        {step === 'contact' && (
                            <motion.div
                                key="contact"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Phone Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                                            <input
                                                type="tel"
                                                placeholder="+91 00000 00000"
                                                className="w-full bg-background border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-accent outline-none transition-all font-medium"
                                                value={contactInfo.phone}
                                                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="guest@example.com"
                                                className="w-full bg-background border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:border-accent outline-none transition-all font-medium"
                                                value={contactInfo.email}
                                                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                >
                                    Proceed to payment <ChevronRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {step === 'intent' && (
                            <motion.div
                                key="intent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg uppercase tracking-wider">Securing Connection</h4>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest animate-pulse">Initializing encrypted payment node...</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'method' && (
                            <motion.div
                                key="method"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <button onClick={() => setStep('contact')} className="flex items-center gap-2 text-[10px] font-bold text-muted hover:text-foreground uppercase tracking-widest transition-all mb-4">
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to details
                                </button>

                                <div className="space-y-3">
                                    {[
                                        { id: 'upi', icon: Globe, title: 'UPI Payment', sub: 'Instant verification' },
                                        { id: 'card', icon: CreditCard, title: 'Credit / Debit Card', sub: 'All major cards accepted' }
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => selectMethod(m.id)}
                                            className="w-full p-4 bg-background border border-border rounded-xl flex items-center justify-between hover:border-accent hover:bg-accent/5 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border">
                                                    <m.icon className="w-5 h-5 text-muted hover:text-accent" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs uppercase tracking-wider">{m.title}</p>
                                                    <p className="text-[10px] text-muted font-medium">{m.sub}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                                <div className="space-y-2">
                                    <h4 className="font-bold text-lg uppercase tracking-wider">Processing Payment</h4>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest animate-pulse">Communicating with banking servers...</p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-xl uppercase tracking-wider text-emerald-600">Payment Successful</h4>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Transaction node verified</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    {step !== 'processing' && step !== 'success' && (
                        <div className="pt-6 mt-6 border-t border-border flex justify-center items-center gap-6 opacity-60">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">PCI-DSS Compliant</span>
                            </div>
                            <div className="w-[1px] h-3 bg-border" />
                            <div className="flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-accent" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">256-bit AES</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
