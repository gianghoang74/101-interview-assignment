import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
} from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { getToken } from '../api/token';
import type { AuthUser } from '../api/types';

interface AuthContextValue {
  user: AuthUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      queryClient.clear();
    });
    if (getToken()) {
      fetchMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await apiLogin(email, password);
    setUser(loggedIn);
  }, []);

  const logout = useCallback(async () => {
    apiLogout();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, initializing, login, logout }),
    [user, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
