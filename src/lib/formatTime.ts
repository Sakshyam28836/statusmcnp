// Timezone-aware time formatting helpers.
// Supports switching between the user's local timezone and UTC via TimeMode.

import type { TimeMode } from '@/hooks/useTimeMode';

export const userTimeZone: string =
  (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  'UTC';

const tzFor = (mode: TimeMode = 'local') => (mode === 'utc' ? 'UTC' : userTimeZone);

export const timeZoneAbbr = (mode: TimeMode = 'local', date: Date = new Date()): string => {
  if (mode === 'utc') return 'UTC';
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: userTimeZone,
      timeZoneName: 'short',
    }).formatToParts(date);
    const tz = parts.find((p) => p.type === 'timeZoneName');
    return tz?.value ?? userTimeZone;
  } catch {
    return userTimeZone;
  }
};

export const formatTime = (date: Date | string | number, mode: TimeMode = 'local'): string => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tzFor(mode),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

export const formatDateTime = (date: Date | string | number, mode: TimeMode = 'local'): string => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tzFor(mode),
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatTimeWithTz = (date: Date | string | number, mode: TimeMode = 'local'): string =>
  `${formatTime(date, mode)} ${timeZoneAbbr(mode, date instanceof Date ? date : new Date(date))}`;

// Back-compat aliases used by earlier code
export const formatLocalTime = (d: Date | string | number) => formatTime(d, 'local');
export const formatLocalDateTime = (d: Date | string | number) => formatDateTime(d, 'local');
export const formatLocalWithTz = (d: Date | string | number) => formatTimeWithTz(d, 'local');
