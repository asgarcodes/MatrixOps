import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

export const seedFirestoreData = async (lat?: number, lng?: number) => {
    try {
        const _db = db;
        if (!_db) {
            throw new Error("Database not initialized. Check your configuration.");
        }
        const eventsCol = collection(_db, 'events');

        // 1. Safety Guard: Prevent accidental wipes
        // Only allow clearing data if explicitly requested via a "clear" parameter or in dev mode
        // For this professional version, we skip auto-deletion to avoid data loss.
        console.log("Starting incremental seed...");

        // 2. Define category-specific mock events
        const targetLat = lat || 40.7128;
        const targetLng = lng || -74.0060;

        const LOCAL_MOCK = [
            {
                title: "Sonic Fusion Festival",
                description: "Experience a blend of contemporary and classical music in the heart of the city. A premier cultural event for all music lovers.",
                category: "Cultural",
                lat: targetLat + (Math.random() * 0.01 - 0.005),
                lng: targetLng + (Math.random() * 0.01 - 0.005),
                start_time: oneHourAgo.toISOString(),
                end_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
                created_at: serverTimestamp()
            },
            {
                title: "Quantum Physics Workshop",
                description: "Join leading scientists for an educational deep-dive into the mysteries of quantum entanglement and state-of-the-art research.",
                category: "Educational",
                lat: targetLat + (Math.random() * 0.02 - 0.01),
                lng: targetLng + (Math.random() * 0.02 - 0.01),
                start_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
                end_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
                created_at: serverTimestamp()
            },
            {
                title: "Sector 7 Basketball Derby",
                description: "High-stakes sports action as urban teams compete for the metropolitan championship. Don't miss the intensity.",
                category: "Sports",
                lat: targetLat + (Math.random() * 0.015 - 0.0075),
                lng: targetLng + (Math.random() * 0.015 - 0.0075),
                start_time: tomorrow.toISOString(),
                end_time: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                created_at: serverTimestamp()
            },
            {
                title: "AI & Ethics Symposium",
                description: "An educational gathering to discuss the future of intelligence and our responsibilities in the digital age.",
                category: "Educational",
                lat: targetLat + (Math.random() * 0.012 - 0.006),
                lng: targetLng + (Math.random() * 0.012 - 0.006),
                start_time: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
                end_time: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
                created_at: serverTimestamp()
            },
            {
                title: "Metropolitan Art Expo",
                description: "Witness the convergence of digital and physical art from local creators. A cultural landmark for the season.",
                category: "Cultural",
                lat: targetLat + (Math.random() * 0.008 - 0.004),
                lng: targetLng + (Math.random() * 0.008 - 0.004),
                start_time: oneHourAgo.toISOString(),
                end_time: tomorrow.toISOString(),
                created_at: serverTimestamp()
            }
        ];

        // 3. Re-seed
        for (const event of LOCAL_MOCK) {
            await addDoc(eventsCol, event);
        }

        alert(lat ? 'Matrix Nodes synchronized with Regional Sectors!' : 'Global database re-seeded successfully!');
        window.location.reload();
    } catch (error: any) {
        console.error("Error seeding data:", error);
        alert('Sync Error: ' + error.message);
    }
};
