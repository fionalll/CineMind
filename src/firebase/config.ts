// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {   // Add yours firebase 
  apiKey: "   ",
  authDomain: "  ",
  projectId: "   ",
  storageBucket: "    ",
  messagingSenderId: "   ",
  appId: "   ",
  measurementId: "  "
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
