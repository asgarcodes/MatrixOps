import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

async function seed() {
    console.log("🚀 Initializing Matrix Synchronization...");

    try {
        const eventsCol = collection(db, 'events');
        const snapshot = await getDocs(eventsCol);

        console.log(`🗑️ Wiping ${snapshot.size} legacy nodes...`);
        const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, 'events', document.id)));
        await Promise.all(deletePromises);

        const MOCK_EVENTS = [
            {
                title: "Global Nexus Hub",
                description: "Primary synchronization sector for metropolitan data streams.",
                lat: 40.7128,
                lng: -74.0060,
                start_time: oneHourAgo.toISOString(),
                end_time: twoHoursLater.toISOString(),
                created_at: now.toISOString()
            },
            {
                title: "Encryption Summit 2026",
                description: "High-security gathering of system architects and crypto-engineers.",
                lat: 40.7589,
                lng: -73.9851,
                start_time: new Date("2026-03-15T09:00:00Z").toISOString(),
                end_time: new Date("2026-03-15T18:00:00Z").toISOString(),
                created_at: now.toISOString()
            },
            {
                title: "Neon Pulse Market",
                description: "Underground trade sector for experimental data-chips.",
                lat: 40.7306,
                lng: -73.9352,
                start_time: new Date("2026-05-10T11:00:00Z").toISOString(),
                end_time: new Date("2026-05-10T20:00:00Z").toISOString(),
                created_at: now.toISOString()
            }
        ];

        console.log("📡 Extracting new signals into the matrix...");
        for (const event of MOCK_EVENTS) {
            await addDoc(eventsCol, event);
            console.log(`✅ Signal Synchronized: ${event.title}`);
        }

        console.log("\n✨ Matrix Synchronization Complete. System Nominal.");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Critical Sync Failure:", error);
        process.exit(1);
    }
}

seed();
