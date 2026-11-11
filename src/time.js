export const J2000 = 2451545.0;
export const JD_UNIX_EPOCH = 2440587.5;
export const MS_PER_DAY = 86400000;

export function dateToJd(date) {
  return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
}

export function jdToDate(jd) {
  return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
}

export function addDays(jd, days) {
  return jd + days;
}

function partsInZone(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return map;
}

/** Offset in minutes east of UTC for the given instant and IANA zone. */
export function offsetMinutes(timeZone, date) {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour), Number(p.minute), Number(p.second),
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

/**
 * Convert wall-clock local time in an IANA timezone to a UTC Date.
 * Handles DST by iterating to a fixed point.
 */
export function localToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
  if (/^[+-]\d{2}:\d{2}$/.test(timeZone)) {
    const sign = timeZone.startsWith('-') ? -1 : 1;
    const [h, m] = timeZone.slice(1).split(':').map(Number);
    const offset = sign * (h * 60 + m);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second) - offset * 60000);
  }

  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  let stamp = naive;
  for (let i = 0; i < 4; i += 1) {
    const off = offsetMinutes(timeZone, new Date(stamp));
    const next = naive - off * 60000;
    if (next === stamp) break;
    stamp = next;
  }
  return new Date(stamp);
}

export function formatInZone(date, timeZone) {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export function formatDateInZone(date, timeZone) {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

export function formatJd(jd, timeZone) {
  return formatInZone(jdToDate(jd), timeZone);
}

export function isoUtc(date) {
  return date.toISOString().replace('.000Z', 'Z');
}

export function zoneLabel(timeZone, date) {
  const off = offsetMinutes(timeZone, date);
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}
