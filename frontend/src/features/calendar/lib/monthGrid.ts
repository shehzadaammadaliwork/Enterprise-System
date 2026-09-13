/// A 6x7 month grid always starts on a Sunday and ends on a Saturday, so it
/// naturally spans a few days of the leading/trailing adjacent months —
/// the calendar queries exactly this visible range (not just the 1st..last
/// of the month) so those overflow days aren't left empty.
export interface MonthGrid {
  weeks: Date[][];
  rangeStart: Date;
  rangeEnd: Date;
}

export function buildMonthGrid(year: number, month: number): MonthGrid {
  const firstOfMonth = new Date(year, month, 1);
  const rangeStart = new Date(year, month, 1 - firstOfMonth.getDay());
  const weeks: Date[][] = [];
  const cursor = new Date(rangeStart);

  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  const rangeEnd = new Date(cursor);
  rangeEnd.setDate(rangeEnd.getDate() - 1);
  rangeEnd.setHours(23, 59, 59, 999);

  return { weeks, rangeStart, rangeEnd };
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateTimeLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
