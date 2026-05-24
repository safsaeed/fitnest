import * as React from "react";

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function InputField({
  label,
  name,
  id,
  error,
  hint,
  className = "",
  required,
  ...props
}: InputFieldProps) {
  const inputId = id ?? name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-(--color-text-secondary)"
      >
        {label}
        {required && <span className="text-(--color-danger)"> *</span>}
      </label>

      <input
        id={inputId}
        name={name}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
          "border-(--color-brand) bg-white text-(--color-text-secondary)",
          "placeholder:text-(--color-text-muted)",
          "focus:focus:ring-1 focus:ring-(--color-brand)",
          "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-70",
          error ? "border-(--color-danger) focus:border-(--color-danger)" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-(--color-text-muted)">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1 text-xs text-(--color-danger)">
          {error}
        </p>
      )}
    </div>
  );
}