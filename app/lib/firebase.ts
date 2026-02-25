import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate config
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (!isConfigValid && typeof window !== 'undefined') {
    console.warn("Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_ environment variables are set.");
}

// Only initialize if we have a valid config and no app exists
let app: FirebaseApp | null = null;

if (isConfigValid) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

// Export services safely. If app is null, these will be null.
// The app must check for these before use.
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { auth, db };
