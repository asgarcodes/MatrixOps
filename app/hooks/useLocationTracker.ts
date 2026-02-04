import { useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export function useLocationTracker(userId: string | undefined) {
    useEffect(() => {
        if (!userId) return

        const updateLocation = async (pos: GeolocationPosition) => {
            const { latitude, longitude } = pos.coords

            try {
                await setDoc(doc(db, 'profiles', userId), {
                    live_location: {
                        lat: latitude,
                        lng: longitude
                    },
                    updated_at: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error('Location update error:', error)
            }
        }

        if (!navigator.geolocation) return;

        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(updateLocation, (err) => console.error(err), { enableHighAccuracy: true })
        }, 60000)

        navigator.geolocation.getCurrentPosition(updateLocation, (err) => console.error(err), { enableHighAccuracy: true })

        return () => clearInterval(interval)
    }, [userId])
}
