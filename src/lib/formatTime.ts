// Timezone-aware time formatting helpers.
// All timestamps rendered in the user's local timezone.

export const userTimeZone: string =
  (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
  'UTC';

export const timeZoneAbbr = (date: Date = new Date()): string => {
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

export const formatLocalTime = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: userTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

export const formatLocalDateTime = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: userTimeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatLocalWithTz = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return `${formatLocalTime(d)} ${timeZoneAbbr(d)}`;
};
