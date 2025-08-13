// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHa_ClMEr3SVU58JkrUwbWzEsvpHmEgH4",
  authDomain: "film-ana.firebaseapp.com",
  projectId: "film-ana",
  storageBucket: "film-ana.firebasestorage.app",
  messagingSenderId: "196980311830",
  appId: "1:196980311830:web:ec07c0355b1d3111167237",
  measurementId: "G-2WNDLLVYDE"
};

// Initialize Firebase app first
const app = initializeApp(firebaseConfig);

// Initialize Auth immediately after app
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics only in browser environment to prevent SSR issues
let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Debug: Log successful Firebase initialization
console.log('🔥 Firebase initialized successfully');
console.log('📧 Auth instance:', auth);
console.log('🗄️ Firestore instance:', db);

export { auth, analytics, app, db };
export default app;
