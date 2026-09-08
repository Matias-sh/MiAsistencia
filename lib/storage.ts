import { getArgentineHolidays } from "./holidays";
import type { AppState, AttendanceStatus, DayRecord, Profile } from "./types";

const STORAGE_KEY = "registro-asistencia-v1";
const MAX_TEXT = 160;
const MAX_NOTE = 280;
const MAX_RECORDS = 4000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_PROFILE: Profile = {
  fullName: "",
  role: "",
  department: "",
  company: "",
  supervisorTitle: "Jefe / superior",
};

const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  records: {},
};

function sanitizeText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max);
}

function isStatus(value: unknown): value is AttendanceStatus {
  return (
    value === "" ||
    value === "presente" ||
    value === "ausente" ||
    value === "feriado" ||
    value === "licencia"
  );
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && value === toIsoFromDate(date);
}

function toIsoFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeProfile(raw: unknown): Profile {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    fullName: sanitizeText(data.fullName),
    role: sanitizeText(data.role),
    department: sanitizeText(data.department),
    company: sanitizeText(data.company),
    supervisorTitle:
      sanitizeText(data.supervisorTitle) || DEFAULT_PROFILE.supervisorTitle,
  };
}

function sanitizeRecords(raw: unknown): Record<string, DayRecord> {
  const records: Record<string, DayRecord> = {};
  if (!raw || typeof raw !== "object") return records;

  for (const [iso, record] of Object.entries(raw as Record<string, unknown>)) {
    if (!isIsoDate(iso) || Object.keys(records).length >= MAX_RECORDS) continue;
    if (!record || typeof record !== "object") continue;

    const row = record as Record<string, unknown>;
    records[iso] = {
      date: iso,
      status: isStatus(row.status) ? row.status : "",
      note: sanitizeText(row.note, MAX_NOTE),
    };
  }

  return records;
}

export function parseState(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_STATE;
  }

  const data = raw as Record<string, unknown>;
  return {
    profile: sanitizeProfile(data.profile),
    records: sanitizeRecords(data.records),
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return parseState(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): boolean {
  if (typeof window === "undefined") return false;

  try {
    const safe = parseState(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}

export function serializeBackup(state: AppState): string {
  const safe = parseState(state);
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: safe.profile,
      records: safe.records,
    },
    null,
    2,
  );
}

export function parseBackup(text: string): AppState {
  return parseState(JSON.parse(text) as unknown);
}

export function suggestedHolidayRecord(
  iso: string,
  year: number,
): DayRecord | null {
  const name = getArgentineHolidays(year)[iso];
  if (!name) return null;

  return {
    date: iso,
    status: "feriado",
    note: sanitizeText(`Feriado · ${name}`, MAX_NOTE),
  };
}

export const FIELD_LIMITS = {
  text: MAX_TEXT,
  note: MAX_NOTE,
} as const;
