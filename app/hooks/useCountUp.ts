'use client'

import { useEffect, useState, useRef } from 'react'

interface UseCountUpOptions {
    /** Target value to count up to */
    end: number
    /** Duration of the animation in ms */
    duration?: number
    /** Decimal places */
    decimals?: number
    /** Whether to start the animation */
    enabled?: boolean
    /** Prefix string (e.g., "₹") */
    prefix?: string
    /** Suffix string (e.g., "%") */
    suffix?: string
    /** Separator for thousands */
    separator?: string
}

export function useCountUp({
    end,
    duration = 1200,
    decimals = 0,
    enabled = true,
    prefix = '',
    suffix = '',
    separator = ','
}: UseCountUpOptions) {
    const [value, setValue] = useState(0)
    const prevEnd = useRef(0)
    const frameRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        if (!enabled) return

        const startValue = prevEnd.current
        const startTime = performance.now()

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic for natural deceleration
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = startValue + (end - startValue) * eased

            setValue(current)

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate)
            } else {
                prevEnd.current = end
            }
        }

        frameRef.current = requestAnimationFrame(animate)

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current)
            }
        }
    }, [end, duration, enabled])

    const formatted = `${prefix}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator)}${suffix}`

    return { value, formatted }
}
