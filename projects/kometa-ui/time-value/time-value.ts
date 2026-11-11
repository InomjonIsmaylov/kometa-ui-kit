const pad = (n: number) => String(n).padStart(2, '0');

/** A time of day as a Date. The date part is irrelevant and fixed. */
export function dateAt(hour: number, minute: number): Date {
  return new Date(2000, 0, 1, hour, minute, 0, 0);
}

/** `"14:00"` or the server's `"14:00:00"` → Date; anything else → null. */
export function fromHhMm(value: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  return m ? dateAt(Number(m[1]), Number(m[2])) : null;
}

export function toHhMm(d: Date | null | undefined): string {
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
}

/** `"2026-09-14"` → local midnight of that day. */
export function fromIsoDate(value: string | null): Date | null {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

export function toIsoDate(d: Date | null | undefined): string | null {
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : null;
}
