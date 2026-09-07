import { useCallback, useEffect, useState } from 'react';

// 'system' is the default and is not the same as picking light: it means follow
// the OS, and keep following it if the viewer changes it later. The two
// explicit choices write data-theme onto <html>, which GlobalStyle's selectors
// use to beat the prefers-color-scheme media query in both directions.
export type ThemeMode = 'system' | 'light' | 'dark';

const StorageKey = 'nfl-picks:theme';

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

// Reads can throw outright, not merely come back empty: Safari in private mode
// and any browser set to block site data reject localStorage access. A theme
// preference is not worth taking the app down for, so every access is guarded
// and falls back to following the system.
const readStoredMode = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(StorageKey);
    return isThemeMode(stored) ? stored : 'system';
  } catch (error) {
    return 'system';
  }
};

const writeStoredMode = (mode: ThemeMode) => {
  try {
    if (mode === 'system') {
      // Removed rather than stored, so a viewer who goes back to following the
      // OS is not pinned to whatever it happened to be on that day.
      window.localStorage.removeItem(StorageKey);
    } else {
      window.localStorage.setItem(StorageKey, mode);
    }
  } catch (error) {
    // Preference simply won't survive a reload. Nothing else breaks.
  }
};

// Applied to <html>, not <body>: the custom properties are declared on :root so
// everything inherits them, and the attribute has to sit on the same element
// the selectors match.
const applyMode = (mode: ThemeMode) => {
  const root = document.documentElement;

  if (mode === 'system') {
    root.removeAttribute('data-theme');
    return;
  }

  root.setAttribute('data-theme', mode);
};

// Whether the page is actually dark right now, which is a different question
// from what the viewer chose -- on 'system' it depends on the OS.
export const prefersDark = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export const useThemeMode = () => {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [systemIsDark, setSystemIsDark] = useState(prefersDark);

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // The OS can change while the tab is open, and on 'system' the toggle's own
  // label has to follow it.
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');

    if (!query) {
      return;
    }

    const onChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches);

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  }, []);

  const chooseMode = useCallback((next: ThemeMode) => {
    writeStoredMode(next);
    setMode(next);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);

  // Toggling from 'system' commits to the opposite of whatever is on screen,
  // which is what the viewer is asking for by reaching for the control at all.
  const toggle = useCallback(
    () => chooseMode(isDark ? 'light' : 'dark'),
    [chooseMode, isDark]
  );

  return { mode, isDark, chooseMode, toggle };
};
