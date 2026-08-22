"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./config";

interface AuthContextType {
  user: User | null;
  role: "admin" | "user" | null;
  tier: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  tier: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Set user IMMEDIATELY
        setUser(firebaseUser);

        // 2. Fetch role and tier using a real-time listener, THEN clear loading
        unsubscribeSnapshot = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setRole(data.role as "admin" | "user");
              setTier(data.subscription_tier || "free");
            } else {
              setRole("user");
              setTier("free");
            }
            // Clear loading only after we have the real tier
            setLoading(false);
          },
          (error) => {
            console.error("Error listening to user document:", error);
            setRole("user");
            setTier("free");
            setLoading(false);
          }
        );
      } else {
        // No user — clear everything and stop loading
        setUser(null);
        setRole(null);
        setTier(null);
        setLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, tier, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
