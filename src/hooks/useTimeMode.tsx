import { useCallback, useEffect, useState } from 'react';

export type TimeMode = 'local' | 'utc';
const KEY = 'mcnp-time-mode';

const listeners = new Set<(m: TimeMode) => void>();
let current: TimeMode =
  (typeof localStorage !== 'undefined' && (localStorage.getItem(KEY) as TimeMode)) || 'local';

const setGlobal = (m: TimeMode) => {
  current = m;
  try { localStorage.setItem(KEY, m); } catch { /* ignore */ }
  listeners.forEach((fn) => fn(m));
};

export const useTimeMode = () => {
  const [mode, setMode] = useState<TimeMode>(current);
  useEffect(() => {
    const fn = (m: TimeMode) => setMode(m);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const toggle = useCallback(() => setGlobal(mode === 'local' ? 'utc' : 'local'), [mode]);
  const set = useCallback((m: TimeMode) => setGlobal(m), []);
  return { mode, toggle, setMode: set };
};
