"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getWorkdays,
  isWeekend,
  monthLabel,
  shiftMonth,
  startOfToday,
  toISODate,
} from "@/lib/dates";
import {
  DEFAULT_PROFILE,
  loadState,
  parseBackup,
  saveState,
  serializeBackup,
  suggestedHolidayRecord,
} from "@/lib/storage";
import type { AttendanceStatus, DayRecord, Profile } from "@/lib/types";
import { IconCalendar, IconCheck, IconChevron, IconPrint } from "./Icons";
import { ProfileDialog } from "./ProfileDialog";
import { RegisterDocument } from "./RegisterDocument";

export function AttendanceApp() {
  const today = useMemo(() => startOfToday(), []);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const workdays = useMemo(
    () => getWorkdays(year, monthIndex, today),
    [year, monthIndex, today],
  );

  useEffect(() => {
    const state = loadState();
    setProfile(state.profile);
    setRecords(state.records);
    setReady(true);
    if (!state.profile.fullName.trim()) {
      setProfileOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    setRecords((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const day of workdays) {
        if (next[day.iso]) continue;
        const suggested = suggestedHolidayRecord(day.iso, year);
        if (suggested) {
          next[day.iso] = suggested;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [ready, workdays, year]);

  useEffect(() => {
    if (!ready) return;
    if (!saveState({ profile, records })) {
      setToast("No se pudo guardar. El almacenamiento del navegador está lleno.");
    }
  }, [ready, profile, records]);

  useEffect(() => {
    if (!ready) return;
    const todayRow = document.querySelector('tr[data-today="true"]');
    todayRow?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [ready, year, monthIndex]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const getRecord = useCallback(
    (iso: string): DayRecord => {
      return records[iso] ?? { date: iso, status: "", note: "" };
    },
    [records],
  );

  const updateDay = useCallback(
    (iso: string, patch: Partial<DayRecord>) => {
      setRecords((prev) => {
        const current = prev[iso] ?? { date: iso, status: "", note: "" };
        return {
          ...prev,
          [iso]: { ...current, ...patch, date: iso },
        };
      });
    },
    [],
  );

  const totals = useMemo(() => {
    let present = 0;
    let absent = 0;
    let holiday = 0;
    let leave = 0;
    let pending = 0;

    for (const day of workdays) {
      const status = getRecord(day.iso).status;
      if (status === "presente") present += 1;
      else if (status === "ausente") absent += 1;
      else if (status === "feriado") holiday += 1;
      else if (status === "licencia") leave += 1;
      else pending += 1;
    }

    const workable = workdays.length - holiday;
    return { present, absent, holiday, leave, pending, workable };
  }, [getRecord, workdays]);

  const percent =
    totals.workable === 0
      ? 0
      : Math.round((totals.present / totals.workable) * 100);

  const todayIso = toISODate(today);
  const todayInView = workdays.some((day) => day.iso === todayIso);
  const todayRecord = getRecord(todayIso);

  function goMonth(delta: number) {
    const next = shiftMonth(year, monthIndex, delta);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  }

  function goCurrentMonth() {
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
  }

  function markTodayPresent() {
    if (isWeekend(today)) {
      setToast("Hoy es fin de semana: no forma parte del registro.");
      return;
    }

    if (!todayInView) {
      goCurrentMonth();
    }

    updateDay(todayIso, { status: "presente" });
    setToast("Hoy quedó marcado como presente.");
  }

  function setStatus(iso: string, status: AttendanceStatus) {
    const current = getRecord(iso);
    let note = current.note;
    if (status === "feriado" && !note.trim()) note = "Feriado";
    if (status === "licencia" && !note.trim()) note = "Licencia";
    updateDay(iso, { status, note });
  }

  function completeEmptyAsPresent() {
    const next = { ...records };
    let filled = 0;

    for (const day of workdays) {
      if (day.isFuture) continue;
      const current = next[day.iso];
      if (current?.status) continue;
      next[day.iso] = {
        date: day.iso,
        status: "presente",
        note: current?.note ?? "",
      };
      filled += 1;
    }

    setRecords(next);
    setToast(
      filled
        ? `Se marcaron ${filled} día${filled === 1 ? "" : "s"} como presente.`
        : "No había días vacíos para completar.",
    );
  }

  function printRegister() {
    const previousTitle = document.title;
    document.title = `Registro de asistencia · ${monthLabel(year, monthIndex)}`;
    setToast(
      "En Más ajustes, desmarcá «Encabezados y pies de página» para que no aparezca la URL.",
    );

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);
    window.setTimeout(() => window.print(), 250);
  }

  function exportBackup() {
    const blob = new Blob([serializeBackup({ profile, records })], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = toISODate(startOfToday());
    link.href = url;
    link.download = `asistencia-respaldo-${stamp}.json`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Copia de seguridad descargada.");
  }

  function importBackup(file: File | undefined) {
    if (!file) return;
    if (
      !window.confirm(
        "Esto reemplaza el registro guardado en este navegador. ¿Continuar?",
      )
    ) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== "string") {
          throw new Error("invalid");
        }
        const next = parseBackup(reader.result);
        setProfile(next.profile);
        setRecords(next.records);
        setToast("Respaldo importado.");
      } catch {
        setToast("El archivo no es un respaldo válido.");
      }
    };
    reader.readAsText(file);
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#e7e3db] text-[#4a4540]">
        <p className="text-sm">Cargando registro…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">
          <span className="brand-bar" />
          <div>
            <strong>Asistencia</strong>
            <p>Registro mensual</p>
          </div>
        </div>

        <button
          type="button"
          className="profile-card"
          onClick={() => setProfileOpen(true)}
        >
          <strong>{profile.fullName || "Completar datos personales"}</strong>
          <em>{profile.role || "Nombre, puesto y entidad"}</em>
          <span>Editar datos</span>
        </button>

        <div className="month-panel">
          <div className="month-nav">
            <button type="button" onClick={() => goMonth(-1)} aria-label="Mes anterior">
              <IconChevron className="h-4 w-4" direction="left" />
            </button>
            <div>
              <p>Período</p>
              <strong>{monthLabel(year, monthIndex)}</strong>
            </div>
            <button type="button" onClick={() => goMonth(1)} aria-label="Mes siguiente">
              <IconChevron className="h-4 w-4" direction="right" />
            </button>
          </div>
          <button type="button" className="ghost-link" onClick={goCurrentMonth}>
            <IconCalendar className="h-3.5 w-3.5" />
            Ir al mes actual
          </button>
        </div>

        <section className="stats">
          <div className="stats-head">
            <span>
              {totals.present} de {totals.workable} días hábiles
            </span>
            <b>{percent}%</b>
          </div>
          <div className="meter" aria-hidden>
            <i style={{ width: `${percent}%` }} />
          </div>
          <ul className="stat-list">
            <li>
              <span>Presentes</span>
              <strong>{totals.present}</strong>
            </li>
            <li>
              <span>Ausencias</span>
              <strong>{totals.absent}</strong>
            </li>
            <li>
              <span>Feriados</span>
              <strong>{totals.holiday}</strong>
            </li>
            <li>
              <span>Sin marcar</span>
              <strong>{totals.pending}</strong>
            </li>
          </ul>
        </section>

        <div className="actions">
          <button type="button" className="btn-primary" onClick={markTodayPresent}>
            <IconCheck className="h-4 w-4" />
            {todayRecord.status === "presente"
              ? "Hoy ya está presente"
              : "Marcar hoy presente"}
          </button>
          <button type="button" className="btn-secondary" onClick={completeEmptyAsPresent}>
            Completar vacíos
          </button>
          <button type="button" className="btn-print" onClick={printRegister}>
            <IconPrint className="h-4 w-4" />
            Imprimir para firmar
          </button>
        </div>

        <div className="backup-row">
          <button type="button" className="ghost-link" onClick={exportBackup}>
            Exportar respaldo
          </button>
          <button
            type="button"
            className="ghost-link"
            onClick={() => importRef.current?.click()}
          >
            Importar respaldo
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              importBackup(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        <p className="hint">
          Los datos quedan en este navegador, no en GitHub. Exportá un respaldo
          de vez en cuando. Al imprimir: A4, sin encabezados ni pies, con
          gráficos de fondo.
        </p>
      </aside>

      <main className="workspace">
        <div className="toolbar no-print">
          <p>Vista previa · hoja A4</p>
          <div className="toolbar-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setProfileOpen(true)}
            >
              Datos personales
            </button>
            <button type="button" className="btn-print" onClick={printRegister}>
              <IconPrint className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>

        <div className="desk">
          <RegisterDocument
            profile={profile}
            year={year}
            monthIndex={monthIndex}
            workdays={workdays}
            getRecord={getRecord}
            onStatus={setStatus}
            onNote={(iso, note) => updateDay(iso, { note })}
            totals={totals}
          />
        </div>
      </main>

      <ProfileDialog
        open={profileOpen}
        profile={profile}
        onChange={setProfile}
        onClose={() => setProfileOpen(false)}
      />

      {toast ? (
        <div className="toast no-print" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
