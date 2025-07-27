import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Enable Firebase debug mode in development
if (process.env.NODE_ENV !== 'production') {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZ_ihy3_pQYksERjevUYLgQ5JNzx5omyY",
  authDomain: "bridgeinterntest.firebaseapp.com",
  projectId: "bridgeinterntest",
  storageBucket: "bridgeinterntest.firebasestorage.app",
  messagingSenderId: "484145503886",
  appId: "1:484145503886:web:55e4a191288da5844333df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// If needed, connect to emulator in development
// if (process.env.NODE_ENV === 'development') {
//   connectFirestoreEmulator(db, 'localhost', 8080);
// }

export { auth, db, storage }; 