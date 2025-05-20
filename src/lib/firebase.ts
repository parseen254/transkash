
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: Replace with your actual Firebase project configuration
// Ensure these are set in your .env.local file

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Explicitly check if the API key is missing and log a prominent error.
// This helps confirm if the environment variable is not being loaded correctly.
if (!apiKey) {
  console.error(
    'CRITICAL FIREBASE CONFIG ERROR: NEXT_PUBLIC_FIREBASE_API_KEY is missing or undefined. ' +
    'Please ensure it is correctly set in your .env.local file and that you have RESTARTED the Next.js development server. ' +
    'Firebase will not initialize correctly without it.'
  );
  // Note: Firebase initialization will likely still fail with (auth/invalid-api-key)
  // if the apiKey is indeed undefined when passed to firebaseConfig.
}

const firebaseConfig = {
  apiKey: apiKey, // This will be undefined if the env var is not set, leading to the error
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId,
};

// Initialize Firebase
// This pattern prevents re-initializing the app on hot reloads.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// It's crucial that firebaseConfig was valid (especially apiKey) when initializeApp was called.
// If apiKey was undefined or invalid, getAuth() will likely fail.
const auth = getAuth(app);
const db = getFirestore(app);
const googleAuthProvider = new GoogleAuthProvider();

export { app, auth, db, googleAuthProvider };
