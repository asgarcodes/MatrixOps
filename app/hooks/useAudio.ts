import { useCallback } from 'react'

export function useAudio() {
    const playSound = useCallback((type: 'click' | 'hover' | 'success' | 'alert') => {
        if (typeof window === 'undefined') return

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        switch (type) {
            case 'click':
                oscillator.type = 'sine'
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
                oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.1)
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
                break
            case 'hover':
                oscillator.type = 'triangle'
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
                oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.05)
                gainNode.gain.setValueAtTime(0.02, audioContext.currentTime)
                break
            case 'success':
                oscillator.type = 'sine'
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
                oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2)
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
                break
            case 'alert':
                oscillator.type = 'square'
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime)
                oscillator.frequency.setValueAtTime(110, audioContext.currentTime + 0.1)
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime)
                break
        }

        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
    }, [])

    return { playSound }
}
