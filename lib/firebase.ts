import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for missing env vars in development
if (process.env.NODE_ENV !== 'production') {
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) {
      // eslint-disable-next-line no-console
      console.warn(`Firebase config missing env variable: ${key}`);
    }
  });
}

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;
let analytics: Analytics | undefined;

// Initialize Firebase app (works on both server and client)
if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);

  // Set auth persistence to LOCAL (persists even after browser closes)
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

  // Analytics only works in browser
  if (process.env.NODE_ENV === 'production') {
    analytics = getAnalytics(app);
  }
} else {
  // Server-side: Initialize without persistence
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
}

export { app, db, storage, auth, analytics };
