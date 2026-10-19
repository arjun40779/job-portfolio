const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-07" → "Jul 2026" */
export function formatYearMonth(value: string): string {
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${year ?? ""}`.trim();
}

/** "2024-03" to "2025-08" → "Mar 2024 – Aug 2025"; a null end reads "Present". */
export function formatRange(start: string, end: string | null): string {
  return `${formatYearMonth(start)} – ${end ? formatYearMonth(end) : "Present"}`;
}
