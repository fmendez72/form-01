// js/firebase-config.js
// Firebase SDK v9 (Modular) - Import from CDN

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnBERORVLUOrmnfiT787k9OHM7EPW5Nlw",
  authDomain: "data-collector-2025.firebaseapp.com",
  projectId: "data-collector-2025",
  storageBucket: "data-collector-2025.firebasestorage.app",
  messagingSenderId: "214406301826",
  appId: "1:214406301826:web:395e8e7eb23f7a0c6a8c9b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
