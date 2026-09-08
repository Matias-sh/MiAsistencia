import { toISODate } from "./dates";

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getArgentineHolidays(year: number): Record<string, string> {
  const easter = easterSunday(year);
  const holidays: Record<string, string> = {};

  const add = (date: Date, name: string) => {
    holidays[toISODate(date)] = name;
  };

  add(new Date(year, 0, 1), "Año Nuevo");
  add(addDays(easter, -48), "Carnaval");
  add(addDays(easter, -47), "Carnaval");
  add(new Date(year, 2, 24), "Día Nacional de la Memoria");
  add(addDays(easter, -2), "Viernes Santo");
  add(new Date(year, 3, 2), "Día del Veterano y de los Caídos en Malvinas");
  add(new Date(year, 4, 1), "Día del Trabajador");
  add(new Date(year, 4, 25), "Día de la Revolución de Mayo");
  add(new Date(year, 5, 20), "Paso a la Inmortalidad de Belgrano");
  add(new Date(year, 6, 9), "Día de la Independencia");
  add(new Date(year, 7, 17), "Paso a la Inmortalidad de San Martín");
  add(new Date(year, 9, 12), "Día del Respeto a la Diversidad Cultural");
  add(new Date(year, 10, 20), "Día de la Soberanía Nacional");
  add(new Date(year, 11, 8), "Inmaculada Concepción");
  add(new Date(year, 11, 25), "Navidad");

  return holidays;
}
