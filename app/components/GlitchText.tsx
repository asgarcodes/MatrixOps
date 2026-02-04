'use client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function GlitchText({ text, className = "" }: { text: string, className?: string }) {
    const [isGlitching, setIsGlitching] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.9) {
                setIsGlitching(true)
                setTimeout(() => setIsGlitching(false), 150)
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`relative inline-block ${className}`}>
            <span className="relative z-10">{text}</span>
            {isGlitching && (
                <>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5, x: [-2, 2, -1], y: [1, -1, 0] }}
                        className="absolute top-0 left-0 -z-10 text-rose-500 w-full"
                    >
                        {text}
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5, x: [2, -2, 1], y: [-1, 1, 0] }}
                        className="absolute top-0 left-0 -z-10 text-cyan-500 w-full"
                    >
                        {text}
                    </motion.span>
                </>
            )}
        </div>
    )
}
