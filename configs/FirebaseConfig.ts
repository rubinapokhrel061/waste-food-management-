import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyBsZXqzAWxB9t2KzEPqu1BfSyr9d3pDCnU",
  authDomain: "rubinaproject-118cd.firebaseapp.com",
  projectId: "rubinaproject-118cd",
  storageBucket: "rubinaproject-118cd.firebasestorage.app",
  messagingSenderId: "779798173586",
  appId: "1:779798173586:web:2094d195123d53813f534b",
  measurementId: "G-379EPWS2R2",
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);
export const storage = getStorage(app);
