"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    try {
      const unsubscribe = onAuthChange((user) => {
        if (mounted) {
          setUser(user);
          setLoading(false);
          setError(null);
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.error("Auth initialization error:", err);
      if (mounted) {
        setError(err as Error);
        setLoading(false);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
