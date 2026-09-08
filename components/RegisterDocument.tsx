"use client";

import type { AttendanceStatus, DayRecord, Profile, Workday } from "@/lib/types";
import { formatDisplayDate, monthLabel } from "@/lib/dates";
import { FIELD_LIMITS } from "@/lib/storage";
import { IconCheck } from "./Icons";

type RegisterDocumentProps = {
  profile: Profile;
  year: number;
  monthIndex: number;
  workdays: Workday[];
  getRecord: (iso: string) => DayRecord;
  onStatus: (iso: string, status: AttendanceStatus) => void;
  onNote: (iso: string, note: string) => void;
  totals: {
    present: number;
    workable: number;
    absent: number;
    holiday: number;
    leave: number;
  };
};

const STATUSES: {
  value: AttendanceStatus;
  label: string;
  short: string;
}[] = [
  { value: "presente", label: "Presente", short: "Sí" },
  { value: "ausente", label: "Ausente", short: "No" },
  { value: "feriado", label: "Feriado", short: "F" },
  { value: "licencia", label: "Licencia", short: "L" },
];

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`print-check mx-auto flex items-center justify-center border border-[#1b1917] ${
        checked ? "bg-[#1b1917] text-white" : "bg-white"
      }`}
    >
      {checked ? <IconCheck className="h-2.5 w-2.5" /> : null}
    </span>
  );
}

export function RegisterDocument({
  profile,
  year,
  monthIndex,
  workdays,
  getRecord,
  onStatus,
  onNote,
  totals,
}: RegisterDocumentProps) {
  return (
    <article className="sheet">
      <header className="letterhead">
        <div>
          <p className="letterhead-org">{profile.company}</p>
          <p className="letterhead-area">{profile.department}</p>
        </div>
        <p className="letterhead-meta">
          Lunes a viernes
          <br />
          {monthLabel(year, monthIndex)}
        </p>
      </header>

      <div className="sheet-rule" />

      <h1>Registro de asistencia mensual</h1>
      <p className="sheet-kicker">
        Documento personal de control de asistencia laboral
      </p>

      <section className="info-grid">
        <InfoField label="Nombre completo" value={profile.fullName} />
        <InfoField label="Puesto / Rol" value={profile.role} />
        <InfoField
          label="Departamento / Área"
          value={profile.department}
          omitPrint
        />
        <InfoField
          label="Entidad / Empresa"
          value={profile.company}
          omitPrint
        />
        <InfoField
          label="Mes y año"
          value={monthLabel(year, monthIndex)}
          wide
        />
      </section>

      <table className="register-table">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th rowSpan={2}>N.º</th>
            <th rowSpan={2}>Día</th>
            <th rowSpan={2}>Fecha</th>
            <th colSpan={2} className="asistio">
              Asistió
            </th>
            <th rowSpan={2} className="text-left">
              Observaciones
            </th>
          </tr>
          <tr>
            <th className="sub">Sí</th>
            <th className="sub">No</th>
          </tr>
        </thead>
        <tbody>
          {workdays.map((day) => {
            const record = getRecord(day.iso);
            const weekStart = day.dayName === "Lunes" && day.dayNumber > 1;

            return (
              <tr
                key={day.iso}
                data-today={day.isToday ? "true" : undefined}
                data-week={weekStart ? "true" : undefined}
                className={day.dayNumber % 2 === 0 ? "alt" : undefined}
              >
                <td className="center num">{day.dayNumber}</td>
                <td className="center day">
                  {day.dayName}
                  {day.isToday ? (
                    <span className="today-mark no-print">Hoy</span>
                  ) : null}
                </td>
                <td className="center date">{formatDisplayDate(day.iso)}</td>
                <td className="center print-only">
                  <CheckBox checked={record.status === "presente"} />
                </td>
                <td className="center print-only">
                  <CheckBox checked={record.status === "ausente"} />
                </td>
                <td className="screen-status no-print" colSpan={2}>
                  <div
                    className="status-group"
                    role="group"
                    aria-label={`Asistencia ${day.dayName} ${formatDisplayDate(day.iso)}`}
                  >
                    {STATUSES.map((status) => {
                      const active = record.status === status.value;
                      return (
                        <button
                          key={status.value}
                          type="button"
                          aria-pressed={active}
                          title={status.label}
                          onClick={() =>
                            onStatus(day.iso, active ? "" : status.value)
                          }
                          className={`status-btn ${active ? "is-active" : ""}`}
                        >
                          {status.short}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <input
                    value={record.note}
                    onChange={(event) => onNote(day.iso, event.target.value)}
                    placeholder={day.isFuture ? "" : "Nota"}
                    maxLength={FIELD_LIMITS.note}
                    aria-label={`Observaciones ${formatDisplayDate(day.iso)}`}
                    className="note-input"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="legend no-print">
        Sí presente · No ausente · F feriado · L licencia. El total excluye
        feriados.
      </p>

      <section className="totals">
        <div className="totals-box">
          <span>Total de días asistidos</span>
          <strong>
            {totals.present}
            <em> de {totals.workable}</em>
          </strong>
        </div>
        <p className="totals-extra">
          Ausencias {totals.absent} · Feriados {totals.holiday} · Licencias{" "}
          {totals.leave}
        </p>
      </section>

      <p className="declaration">
        Certifico que la información registrada en este documento es correcta y
        refleja fielmente mi asistencia durante el período indicado.
      </p>

      <footer className="signatures">
        <div>
          <div className="sign-line" />
          <p>Firma del empleado</p>
          <p className="sign-name">{profile.fullName}</p>
          <p className="sign-date">Fecha</p>
        </div>
        <div>
          <div className="sign-line" />
          <p>Firma y sello del {profile.supervisorTitle.toLowerCase()}</p>
          <p className="sign-name">Aclaración y sello</p>
          <p className="sign-date">Fecha</p>
        </div>
      </footer>
    </article>
  );
}

function InfoField({
  label,
  value,
  wide,
  omitPrint,
}: {
  label: string;
  value: string;
  wide?: boolean;
  omitPrint?: boolean;
}) {
  return (
    <div
      className={`info-field ${wide ? "wide" : ""} ${omitPrint ? "print-omit" : ""}`}
    >
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
