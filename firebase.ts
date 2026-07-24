import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC4PsYmQnfbTXNiEAJCzAl90bRoMvYFjbw",
  authDomain: "derma-assist-ai.firebaseapp.com",
  projectId: "derma-assist-ai",
  storageBucket: "derma-assist-ai.firebasestorage.app",
  messagingSenderId: "944049835311",
  appId: "1:944049835311:web:48dd62e7821497d8c425da",
  measurementId: "G-PCENDTNS75"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();