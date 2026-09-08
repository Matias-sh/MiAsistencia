export type AttendanceStatus =
  | "presente"
  | "ausente"
  | "feriado"
  | "licencia"
  | "";

export type DayRecord = {
  date: string;
  status: AttendanceStatus;
  note: string;
};

export type Profile = {
  fullName: string;
  role: string;
  department: string;
  company: string;
  supervisorTitle: string;
};

export type AppState = {
  profile: Profile;
  records: Record<string, DayRecord>;
};

export type Workday = {
  iso: string;
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
};
