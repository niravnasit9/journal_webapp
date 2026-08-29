"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./config";
import { UserDoc } from "@/lib/firebase/schema";

interface AuthContextType {
  user: User | null;
  role: "admin" | "user" | null;
  tier: string | null;
  loading: boolean;
  userDoc: UserDoc | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  tier: null,
  loading: true,
  userDoc: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);

  useEffect(() => {

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Set user IMMEDIATELY
        setUser(firebaseUser);

        // 2. Fetch role and tier using a one-time fetch to avoid hanging listeners
        const fetchDoc = getDoc(doc(db, "users", firebaseUser.uid));
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
        
        Promise.race([fetchDoc, timeout])
          .then((docSnap: any) => {
            if (docSnap.exists && docSnap.exists()) {
              const data = docSnap.data();
              setRole(data.role as "admin" | "user");
              setTier(data.subscription_tier || "free");
              setUserDoc(data as UserDoc);
            } else {
              setRole("user");
              setTier("free");
              setUserDoc(null);
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error("Error fetching user document:", error);
            setRole("user");
            setTier("free");
            setLoading(false);
          });
      } else {
        // No user — clear everything and stop loading
        setUser(null);
        setRole(null);
        setTier("free");
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, tier, loading, userDoc }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
