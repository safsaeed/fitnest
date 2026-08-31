"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";

type HiddenField = {
  name: string;
  value: string;
};

type ConfirmActionDialogProps = {
  action?: () =>
    | void
    | Promise<void | { success: boolean; message?: string }>;
  formAction?: string;
  formMethod?: "GET" | "POST";
  hiddenFields?: HiddenField[];
  children: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function ConfirmActionDialog({
  action,
  formAction,
  formMethod = "POST",
  hiddenFields = [],
  children,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: ConfirmActionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleConfirm() {
    if (!action || isPending) {
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await action();

        if (result && !result.success) {
          setErrorMessage(
            result.message ?? "This action could not be completed.",
          );
          return;
        }

        setIsOpen(false);
      } catch {
        setErrorMessage("This action could not be completed. Please try again.");
      }
    });
  }

  function closeDialog() {
    if (isPending) {
      return;
    }

    setErrorMessage(null);
    setIsOpen(false);
  }

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={closeDialog}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>

        <div className="mt-2 text-sm text-(--color-text-secondary)">
          {description}
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-(--color-danger-hover) bg-(--color-danger-soft) px-3 py-2 text-sm text-(--color-danger)"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            onClick={closeDialog}
            disabled={isPending}
            variant="secondary"
          >
            {cancelLabel}
          </Button>

          {formAction ? (
            <form action={formAction} method={formMethod}>
              {hiddenFields.map((field) => (
                <input
                  key={field.name}
                  type="hidden"
                  name={field.name}
                  value={field.value}
                />
              ))}

              <Button type="submit" variant="destructive">
                {confirmLabel}
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              isLoading={isPending}
              variant="destructive"
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setErrorMessage(null);
          setIsOpen(true);
        }}
        variant="destructive"
        className="min-w-25"
      >
        {children}
      </Button>

      {isOpen ? createPortal(dialog, document.body) : null}
    </>
  );
}
