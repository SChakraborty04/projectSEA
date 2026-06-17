import { z } from "zod";

export type TimeConversionOptions = {
  timezone?: string;
  locale?: string;
  date?: string;
  format?: string;
};

export type TimeInput = TimeConversionOptions & {
  value: string | number;
};

export type BulkTimeInput = TimeConversionOptions & {
  items: TimeInput[];
};

export type ParsedDate = {
  year: number;
  month: number;
  day: number;
};

export type ParsedTime = {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export type DateTimeParts = ParsedDate & {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export const MAX_BULK_TIME_ITEMS = 100;

export const timeInputSchema = z.object({
  value: z.union([z.string().min(1, "Time value is required"), z.number().finite("Time value must be a finite number")]),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  date: z.string().optional(),
  format: z.string().optional(),
});

export const bulkTimeInputSchema = z.object({
  items: z.array(timeInputSchema).min(1, "At least one item is required").max(MAX_BULK_TIME_ITEMS, `Maximum ${MAX_BULK_TIME_ITEMS} items are allowed`),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  date: z.string().optional(),
  format: z.string().optional(),
});

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const MONTH_NAMES = [
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function normalizeTimezone(timezone?: string): string {
  const value = timezone?.trim() || "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return value;
  } catch {
    throw new Error(`Invalid timezone: ${value}`);
  }
}

export function normalizeLocale(locale?: string): string {
  const value = locale?.trim() || "en-US";

  try {
    new Intl.DateTimeFormat(value).resolvedOptions();
    return value;
  } catch {
    return "en-US";
  }
}

export function parseLocalTimeToUtc(value: string | number, options: TimeConversionOptions = {}): Date {
  const timezone = normalizeTimezone(options.timezone);
  const raw = normalizeValue(value);
  const timestamp = parseTimestamp(raw);

  if (timestamp) return timestamp;

  const explicitOffsetDate = parseIsoOrExplicitOffset(raw);

  if (explicitOffsetDate) return explicitOffsetDate;

  const relativeDate = parseRelative(raw, timezone);

  if (relativeDate) return relativeDate;

  const parsed = parseLocalComponents(raw, timezone, options);

  if (parsed) return parsed;

  throw new Error("Unsupported local time format. Use ISO 8601, Unix timestamp, or a common local date/time format.");
}

export function parseUtc(value: string | number): Date {
  const raw = normalizeValue(value);
  const timestamp = parseTimestamp(raw);

  if (timestamp) return timestamp;

  const trimmed = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.test(trimmed)) {
    const date = new Date(trimmed.includes("T") ? `${trimmed}Z` : `${trimmed.replace(" ", "T")}Z`);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const date = new Date(trimmed);

  if (!Number.isNaN(date.getTime())) return date;

  throw new Error("Invalid UTC time. Use ISO 8601 UTC, Unix timestamp, or a UTC date/time string.");
}

export function toUtcResult(input: string | number, date: Date, timezone: string, locale = "en-US") {
  return {
    input: String(input),
    timezone,
    locale,
    utc: date.toISOString(),
    timestamp: date.getTime(),
    localTime: formatLocalTime(date, timezone),
  };
}

export function fromUtcResult(input: string | number, date: Date, timezone: string, locale = "en-US", format = "datetime") {
  return {
    input: String(input),
    timezone,
    locale,
    utc: date.toISOString(),
    timestamp: date.getTime(),
    formatted: formatInTimezone(date, timezone, locale, format),
    localTime: formatLocalTime(date, timezone),
    offset: getUtcOffset(date, timezone),
  };
}

export function formatInTimezone(date: Date, timezone: string, locale = "en-US", format = "datetime"): string {
  const outputFormat = (format || "datetime").toLowerCase();

  switch (outputFormat) {
    case "iso":
    case "iso-local":
      return formatLocalIso(date, timezone);
    case "timestamp":
      return String(date.getTime());
    case "date":
      return new Intl.DateTimeFormat(locale, { timeZone: timezone, dateStyle: "medium" }).format(date);
    case "time":
      return new Intl.DateTimeFormat(locale, { timeZone: timezone, timeStyle: "medium" }).format(date);
    case "datetime":
      return new Intl.DateTimeFormat(locale, { timeZone: timezone, dateStyle: "medium", timeStyle: "medium" }).format(date);
    case "full":
      return new Intl.DateTimeFormat(locale, { timeZone: timezone, dateStyle: "full", timeStyle: "full" }).format(date);
    case "rfc2822":
      return formatRfc2822(date, timezone);
    case "relative":
      return formatRelativeTime(date, locale);
    default:
      throw new Error("Unsupported output format. Use iso, datetime, date, time, full, rfc2822, timestamp, or relative.");
  }
}

export function getUtcOffset(date: Date, timezone: string): string {
  const offsetMs = getTimezoneOffsetMs(timezone, date);
  const sign = offsetMs >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMs);
  const hours = Math.floor(absoluteOffset / 3_600_000);
  const minutes = Math.floor((absoluteOffset % 3_600_000) / 60_000);

  return `${sign}${pad(hours)}:${pad(minutes)}`;
}

export function formatLocalTime(date: Date, timezone: string): string {
  const parts = getDateTimeParts(timezone, date);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`;
}

function normalizeValue(value: string | number): string {
  return typeof value === "number" ? String(value) : value.trim();
}

function parseTimestamp(value: string): Date | null {
  const compact = value.trim();

  if (!/^\d{10,13}$/.test(compact)) return null;

  const timestamp = Number(compact);
  const milliseconds = compact.length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseIsoOrExplicitOffset(value: string): Date | null {
  const trimmed = value.trim();

  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return null;
  }

  const date = new Date(trimmed);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRelative(value: string, timezone: string): Date | null {
  const lower = value.toLowerCase().trim();

  if (lower === "now") return new Date();

  const todayParts = startOfDayInTimezone(new Date(), timezone);
  const today = makeTimezoneDate(todayParts.year, todayParts.month, todayParts.day, 0, 0, 0, 0, timezone);

  if (lower === "today") return today;
  if (lower === "tomorrow") return addDaysInTimezone(today, 1, timezone);
  if (lower === "yesterday") return addDaysInTimezone(today, -1, timezone);

  const relativeInMatch = lower.match(/^in\s+(\d+(?:\.\d+)?)\s*(milliseconds?|ms|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?)$/);

  if (relativeInMatch) {
    const amount = Number(relativeInMatch[1]);
    const unit = relativeInMatch[2];
    const multiplier = relativeUnitToMs(unit);

    return new Date(Date.now() + amount * multiplier);
  }

  return null;
}

function parseLocalComponents(value: string, timezone: string, options: TimeConversionOptions): Date | null {
  const text = value.replace(/\bat\b/gi, " ").replace(/\s+/g, " ").trim();

  if (!text) return null;

  const locale = normalizeLocale(options.locale);
  const fallbackDate = options.date ? parseDateOnly(options.date, timezone, locale, startOfDayInTimezone(new Date(), timezone)) : startOfDayInTimezone(new Date(), timezone);

  if (!fallbackDate) {
    throw new Error("Invalid date context. Use YYYY-MM-DD or a supported date format.");
  }

  const timeMatch = text.match(/\b(?:\d{1,2}(?::\d{2})?(?::\d{2})?|\d{4})(?:\s*[ap]\.?m\.?)?\b/i);
  const timePart = timeMatch?.[0];
  const time = timePart ? parseTime(timePart) : null;

  if (timePart && !time) {
    throw new Error(`Invalid time: ${timePart}`);
  }

  if (!time) {
    const dateOnly = parseDateOnly(text, timezone, locale, fallbackDate);
    return dateOnly ? makeTimezoneDate(dateOnly.year, dateOnly.month, dateOnly.day, 0, 0, 0, 0, timezone) : null;
  }

  const startIndex = timeMatch?.index ?? 0;
  const beforeTime = text.slice(0, startIndex).trim();
  const afterTime = text.slice(startIndex + (timePart as string).length).trim();
  const dateText = [beforeTime, afterTime].filter(Boolean).join(" ");
  const parsedDate = dateText ? parseDateOnly(dateText, timezone, locale, fallbackDate) : fallbackDate;

  if (!parsedDate) {
    throw new Error(`Invalid date: ${dateText || options.date || ""}`);
  }

  return makeTimezoneDate(parsedDate.year, parsedDate.month, parsedDate.day, time.hour, time.minute, time.second, time.millisecond, timezone);
}

function parseTime(value: string): ParsedTime | null {
  let text = value.trim().toLowerCase().replace(/\./g, "");
  const amPm = text.match(/\b([ap])m\b/)?.[1];
  const hasAmPm = Boolean(amPm);

  text = text.replace(/\b[ap]m\b/g, "").replace(/\s+/g, "").trim();

  if (!text) return null;

  let hour: number;
  let minute = 0;
  let second = 0;
  let millisecond = 0;

  if (/^\d{4}$/.test(text)) {
    hour = Math.floor(Number(text) / 100);
    minute = Number(text) % 100;
  } else {
    const parts = text.split(":");

    if (parts.length > 3) return null;

    hour = Number(parts[0]);
    minute = parts[1] ? Number(parts[1]) : 0;

    const secondMatch = (parts[2] || "0").match(/^(\d{1,2})(?:\.(\d{1,3}))?$/);

    if (!secondMatch) return null;

    second = Number(secondMatch[1]);
    millisecond = Number((secondMatch[2] || "").padEnd(3, "0"));
  }

  if (![hour, minute, second, millisecond].every((part) => Number.isFinite(part))) return null;

  if (hasAmPm) {
    if (hour < 1 || hour > 12 || minute > 59 || second > 59) return null;

    if (amPm === "p" && hour !== 12) hour += 12;
    if (amPm === "a" && hour === 12) hour = 0;
  } else if (hour < 0 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  return { hour, minute, second, millisecond };
}

function parseDateOnly(value: string, timezone: string, locale: string, fallbackDate: ParsedDate): ParsedDate | null {
  const text = value.toLowerCase().replace(/\s+/g, " ").trim();

  if (!text) return fallbackDate;
  if (text === "today") return fallbackDate;
  if (text === "tomorrow") return addDaysToDate(fallbackDate, 1);
  if (text === "yesterday") return addDaysToDate(fallbackDate, -1);

  const numericSlashMatch = text.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,2})$/);

  if (numericSlashMatch) {
    const first = Number(numericSlashMatch[1]);
    const second = Number(numericSlashMatch[2]);
    const third = Number(numericSlashMatch[3]);

    if (first >= 1000) {
      return makeParsedDate(first, second, third);
    }

    const year = third < 100 ? 2000 + third : third;
    const useMonthFirst = locale.startsWith("en-US") ? first <= 12 : second <= 12;

    return useMonthFirst ? makeParsedDate(year, first, second) : makeParsedDate(year, second, first);
  }

  const monthNameMatch = text.match(/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(\d{1,2})(?:,)?\s+(\d{4})$/);

  if (monthNameMatch) {
    const month = MONTHS[monthNameMatch[1].replace(".", "")];
    const day = Number(monthNameMatch[2]);
    const year = Number(monthNameMatch[3]);

    return makeParsedDate(year, month, day);
  }

  const dayMonthMatch = text.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s*,?\s*(\d{4})$/);

  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = MONTHS[dayMonthMatch[2].replace(".", "")];
    const year = Number(dayMonthMatch[3]);

    return makeParsedDate(year, month, day);
  }

  return null;
}

function makeParsedDate(year: number, month: number, day: number): ParsedDate {
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${year}-${month}-${day}`);
  }

  return { year, month, day };
}

function makeTimezoneDate(year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond: number, timezone: string): Date {
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let utcTime = localAsUtc - getTimezoneOffsetMs(timezone, new Date(localAsUtc));

  for (let i = 0; i < 4; i += 1) {
    const nextOffset = getTimezoneOffsetMs(timezone, new Date(utcTime));
    const nextUtcTime = localAsUtc - nextOffset;

    if (nextUtcTime === utcTime) break;

    utcTime = nextUtcTime;
  }

  return new Date(utcTime);
}

function startOfDayInTimezone(date: Date, timezone: string): ParsedDate {
  const parts = getDateTimeParts(timezone, date);

  return { year: parts.year, month: parts.month, day: parts.day };
}

function addDaysInTimezone(date: Date, days: number, timezone: string): Date {
  const parts = getDateTimeParts(timezone, date);

  return makeTimezoneDate(parts.year, parts.month, parts.day + days, 0, 0, 0, 0, timezone);
}

function addDaysToDate(date: ParsedDate, days: number): ParsedDate {
  const parsed = new Date(Date.UTC(date.year, date.month - 1, date.day + days));

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

function getDateTimeParts(timezone: string, date: Date): DateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US-u-hc-h23", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.type === "hour" ? normalizeHour(part.value) : Number(part.value)]),
  ) as Record<string, number>;

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: date.getMilliseconds(),
  };
}

function normalizeHour(value: string): number {
  const hour = Number(value);
  return hour === 24 ? 0 : hour;
}

function getTimezoneOffsetMs(timezone: string, date: Date): number {
  const parts = getDateTimeParts(timezone, date);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  return asUtc - date.getTime();
}

function formatLocalIso(date: Date, timezone: string): string {
  const parts = getDateTimeParts(timezone, date);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}.${String(parts.millisecond).padStart(3, "0")}${getUtcOffset(date, timezone)}`;
}

function formatRfc2822(date: Date, timezone: string): string {
  const parts = getDateTimeParts(timezone, date);

  return `${WEEKDAYS[new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()]}, ${pad(parts.day)} ${MONTH_NAMES[parts.month - 1]} ${parts.year} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)} ${getUtcOffset(date, timezone)}`;
}

function formatRelativeTime(date: Date, locale: string): string {
  const diff = date.getTime() - Date.now();

  if (Math.abs(diff) < 45_000) return "now";

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 365 * 24 * 60 * 60 * 1000],
    ["month", 30 * 24 * 60 * 60 * 1000],
    ["week", 7 * 24 * 60 * 60 * 1000],
    ["day", 24 * 60 * 60 * 1000],
    ["hour", 60 * 60 * 1000],
    ["minute", 60 * 1000],
    ["second", 1000],
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const [unit, milliseconds] = units.find(([, unitMs]) => Math.abs(diff) >= unitMs) || ["second", 1000];

  return formatter.format(Math.round(diff / milliseconds), unit);
}

function relativeUnitToMs(unit: string): number {
  if (unit.startsWith("milli")) return 1;
  if (unit.startsWith("second") || unit.startsWith("sec")) return 1000;
  if (unit.startsWith("minute") || unit.startsWith("min")) return 60_000;
  if (unit.startsWith("hour") || unit.startsWith("hr")) return 3_600_000;
  if (unit.startsWith("day")) return 24 * 3_600_000;
  if (unit.startsWith("week")) return 7 * 24 * 3_600_000;
  return 30 * 24 * 3_600_000;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
