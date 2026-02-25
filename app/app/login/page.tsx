'use client'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, LogIn, UserPlus, CheckCircle2, Loader2, Map as MapIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const showSuccess = () => {
        setIsSuccess(true)
        setLoading(false)
        setTimeout(() => {
            router.push('/')
        }, 1500)
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        const _auth = auth
        if (!_auth) {
            alert("Authentication service not initialized.")
            return
        }
        setLoading(true)

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(_auth, email, password)
            } else {
                await signInWithEmailAndPassword(_auth, email, password)
            }
            showSuccess()
        } catch (error: any) {
            alert(error.message)
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        const _auth = auth
        if (!_auth) {
            alert("Authentication service not initialized.")
            return
        }
        const provider = new GoogleAuthProvider()
        try {
            setLoading(true)
            await signInWithPopup(_auth, provider)
            showSuccess()
        } catch (error: any) {
            alert(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.div
                        key="login-form"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10"
                    >
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20"
                            >
                                <MapIcon className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h1>
                            <p className="text-gray-500 text-sm font-medium">
                                {isSignUp ? 'Join the local event network' : 'Sign in to access your dashboard'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10"></span>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-gray-500">
                                    <span className="bg-[#0a0a0a] px-4">OR</span>
                                </div>
                            </div>

                            <form onSubmit={handleEmailAuth} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/5 rounded-xl focus:border-blue-500 focus:bg-white/10 outline-none text-white placeholder-gray-600 transition-all text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/5 rounded-xl focus:border-blue-500 focus:bg-white/10 outline-none text-white placeholder-gray-600 transition-all text-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />
                                    )}
                                    {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                                </motion.button>

                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="w-full text-center text-xs text-gray-500 hover:text-white transition-colors pt-2 font-medium"
                                >
                                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm bg-[#0a0a0a] border border-emerald-500/20 rounded-[3rem] p-12 text-center relative z-10"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
                            className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                        >
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">Success</h2>
                        <p className="text-emerald-500/60 font-medium text-sm">Welcome to the Matrix</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
