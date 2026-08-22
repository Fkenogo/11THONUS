/**
 * Minimal, reusable UI primitives (`ENG-P3-002B`). The repository had no
 * design-system dependency (no shadcn/Radix) — per Founder direction, this
 * package introduces only this small local layer, built on native semantic
 * HTML elements plus the existing Tailwind theme tokens (`index.css`'s
 * `--color-*` variables) and `cn()`, not a new UI dependency and not a
 * broader design-system architecture.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

const baseFieldClasses =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50";

export function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  errorMessage,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  errorMessage?: string;
  type?: string;
  required?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange?.(event.target.value)}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        className={cn(baseFieldClasses, errorMessage && "border-red-600")}
      />
      <FieldError id={errorId} message={errorMessage} />
    </div>
  );
}

export function Select({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  errorMessage,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  errorMessage?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        className={cn(baseFieldClasses, errorMessage && "border-red-600")}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={errorMessage} />
    </div>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[var(--color-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return (
    <button
      {...rest}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          : "border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
