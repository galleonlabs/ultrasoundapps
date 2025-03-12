import { initializeApp } from "@firebase/app";
import { getAnalytics } from "@firebase/analytics";
import { getFirestore } from "@firebase/firestore";
import { getAuth } from "@firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services without try/catch to properly expose initialization errors
// This allows us to see actual Firebase errors instead of just "Service firestore is not available"
console.log("Initializing Firestore...");
const firestoreInstance = getFirestore(app);
console.log("Firestore initialized successfully");

console.log("Initializing Auth...");
const authInstance = getAuth(app);
console.log("Auth initialized successfully");

export const db = firestoreInstance;
export const auth = authInstance;
// Initialize Analytics with care to prevent errors
let analyticsInstance;
try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  console.error("Analytics initialization error:", error);
  analyticsInstance = null;
}
export const analytics = analyticsInstance;

export default app;
