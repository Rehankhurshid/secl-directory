import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCkws6mLQwypnSZmkREy92vsp00YKVdKLs",
  authDomain: "project-list-5aead.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-list-5aead",
  storageBucket: "project-list-5aead.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "107892075896",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:107892075896:web:47fdbfe78953ab8d222c8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

export { getToken, onMessage };