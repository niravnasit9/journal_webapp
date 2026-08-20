"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

interface AuthContextType {
  user: User | null;
  role: "admin" | "user" | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Set user and clear loading IMMEDIATELY — don't wait for Firestore
        setUser(firebaseUser);
        setLoading(false);

        // 2. Fetch role in background (non-blocking)
        getDoc(doc(db, "users", firebaseUser.uid))
          .then((docSnap) => {
            if (docSnap.exists()) {
              setRole(docSnap.data().role as "admin" | "user");
            } else {
              setRole("user");
            }
          })
          .catch(() => {
            setRole("user"); // default on error
          });
      } else {
        // No user — clear everything and stop loading
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
