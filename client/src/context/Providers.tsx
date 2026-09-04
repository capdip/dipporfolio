import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useSettings } from '../hooks/useContent';
import type { PublicUser } from '../../../shared/types';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  reducedEffects: boolean;
  toggleTheme: () => void;
  setReducedEffects: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Applies theme CSS variables to :root. Uses the shared settings query so
 * saving a theme in the admin applies instantly across the whole app. */
const ThemeApplier = ({ children, mode }: { children: React.ReactNode; mode: 'light' | 'dark' }) => {
  const { data: settings } = useSettings();

  useEffect(() => {
    if (!settings?.theme) return;
    const t = settings.theme;
    const root = document.documentElement;
    const darken = (hex: string, amount = 0.82): string => {
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
      const ch = [1, 3, 5].map((i) =>
        Math.round(parseInt(hex.slice(i, i + 2), 16) * amount)
      );
      return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
    };
    root.style.setProperty('--primary', t.accentColor);
    root.style.setProperty('--primary-strong', darken(t.accentColor));
    root.style.setProperty('--accent', t.accentColorSecondary);
    // Backgrounds follow the currently active light/dark mode.
    if (mode === 'dark' && t.darkBackground) root.style.setProperty('--background', t.darkBackground);
    if (mode === 'light' && t.lightBackground) root.style.setProperty('--background', t.lightBackground);
    if (t.fontFamilyHeading) root.style.setProperty('--font-heading-stack', `'${t.fontFamilyHeading}', sans-serif`);
    if (t.fontFamilyBody) root.style.setProperty('--font-body-stack', `'${t.fontFamilyBody}', sans-serif`);
    if (t.radius) root.style.setProperty('--radius-tokens', t.radius);
  }, [settings, mode]);

  return <>{children}</>;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Settings live in the shared query cache (QueryClientProvider wraps App),
  // so the saved "Default theme" from the admin Theme editor can be honored.
  const { data: settings } = useSettings();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Apply the site-wide default theme whenever the visitor has not made an
  // explicit personal choice (toggle in the header), and react to admin changes.
  useEffect(() => {
    if (localStorage.getItem('theme')) return;
    const def = settings?.theme?.defaultTheme;
    if (def === 'light' || def === 'dark') setTheme(def);
  }, [settings]);
  const [reducedEffects, setReducedEffectsState] = useState<boolean>(() => {
    const saved = localStorage.getItem('reduced-effects');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setReducedEffects = useCallback((value: boolean) => {
    setReducedEffectsState(value);
    localStorage.setItem('reduced-effects', String(value));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      reducedEffects,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      setReducedEffects,
    }),
    [theme, reducedEffects, setReducedEffects]
  );

  return <ThemeContext.Provider value={value}><ThemeApplier mode={theme}>{children}</ThemeApplier></ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
