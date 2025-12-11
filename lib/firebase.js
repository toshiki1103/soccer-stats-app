import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDSO75MJ4ykgOMP47xj5uk8KRKuk9ZRo4c",
  authDomain: "stats-5c2e6.firebaseapp.com",
  projectId: "stats-5c2e6",
  storageBucket: "stats-5c2e6.firebasestorage.app",
  messagingSenderId: "456656518126",
  appId: "1:456656518126:web:d45842b221671adf73acff"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
