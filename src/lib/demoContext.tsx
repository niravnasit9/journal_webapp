"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './firebase/authContext';

interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemoMode: false,
  toggleDemoMode: () => {},
});

export const useDemo = () => useContext(DemoContext);

export const DemoProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { role } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('isDemoMode');
    if (stored === 'true') {
      setIsDemoMode(true);
    }
  }, []);

  useEffect(() => {
    if (role !== 'admin' && isDemoMode) {
      setIsDemoMode(false);
      localStorage.setItem('isDemoMode', 'false');
    }
  }, [role, isDemoMode]);

  const toggleDemoMode = () => {
    const newVal = !isDemoMode;
    setIsDemoMode(newVal);
    localStorage.setItem('isDemoMode', String(newVal));
    
    if (newVal) {
      toast.success("Demo Mode Activated: Viewing dummy data", { icon: '🎮' });
    } else {
      toast.success("Demo Mode Disabled: Viewing live data", { icon: '🟢' });
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
};
