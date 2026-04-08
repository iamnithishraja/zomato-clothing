/** Local calendar YYYY-MM-DD (browser / admin workstation timezone) */
export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Inclusive range: today back through (numDays - 1) earlier days */
export function dateRangePresetDays(numDays: number): { from: string; to: string } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (numDays - 1));
  return { from: formatLocalYmd(start), to: formatLocalYmd(end) };
}
