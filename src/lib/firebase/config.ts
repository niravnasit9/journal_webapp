import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIh_S4m7l4CC_FwjpM2ufwaA8Z2bpeuaY",
  authDomain: "journalreview.firebaseapp.com",
  projectId: "journalreview",
  storageBucket: "journalreview.firebasestorage.app",
  messagingSenderId: "1017732753848",
  appId: "1:1017732753848:web:f8262ca8d3799a5268874d",
  measurementId: "G-JJTY6JJ94S"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
