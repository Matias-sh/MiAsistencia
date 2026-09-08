"use client";

import { useEffect, useId, useRef } from "react";
import { FIELD_LIMITS } from "@/lib/storage";
import type { Profile } from "@/lib/types";

type ProfileDialogProps = {
  open: boolean;
  profile: Profile;
  onChange: (profile: Profile) => void;
  onClose: () => void;
};

const FIELDS: { key: keyof Profile; label: string; placeholder: string }[] = [
  { key: "fullName", label: "Nombre completo", placeholder: "Apellido, Nombre" },
  { key: "role", label: "Puesto / Rol", placeholder: "Ej. Desarrollador Android" },
  { key: "department", label: "Departamento / Área", placeholder: "Ej. Push Software" },
  {
    key: "company",
    label: "Entidad / Empresa",
    placeholder: "Ej. Secretaría de Ciencia y Tecnología",
  },
  { key: "supervisorTitle", label: "Cargo de quien firma", placeholder: "Jefe / superior" },
];

export function ProfileDialog({
  open,
  profile,
  onChange,
  onClose,
}: ProfileDialogProps) {
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="dialog-scrim"
        aria-label="Cerrar datos personales"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dialog-panel"
      >
        <h2 id={titleId}>Datos personales</h2>
        <p className="lead">
          Van en el encabezado del documento impreso. Se pueden cambiar en
          cualquier momento.
        </p>

        <div className="mt-6 grid gap-5">
          {FIELDS.map((field, index) => (
            <label key={field.key}>
              <span className="field-label">{field.label}</span>
              <input
                ref={index === 0 ? firstField : undefined}
                value={profile[field.key]}
                onChange={(event) =>
                  onChange({ ...profile, [field.key]: event.target.value })
                }
                placeholder={field.placeholder}
                maxLength={FIELD_LIMITS.text}
                autoComplete="off"
                spellCheck={false}
                className="field-input"
              />
            </label>
          ))}
        </div>

        <button type="button" onClick={onClose} className="btn-primary mt-8 w-full">
          Guardar
        </button>
      </div>
    </div>
  );
}
