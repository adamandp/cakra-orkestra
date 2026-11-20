export const SCORE_TIME_ZONE = "Asia/Jakarta";
export const SCORE_PAGE_SIZE = 10;
export const SCORE_POLL_INTERVAL = 1500;

const monthFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

export function getScoreMonth(date = new Date()) {
  const parts = monthFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function formatScoreDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SCORE_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
