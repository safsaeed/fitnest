"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";

type HiddenField = {
  name: string;
  value: string;
};

type ConfirmActionDialogProps = {
  action?: () => void | Promise<void>;
  formAction?: string;
  formMethod?: "GET" | "POST";
  hiddenFields?: HiddenField[];
  children: React.ReactNode;
  title: string;
  description: string;
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
    if (!action) {
      return;
    }

    startTransition(async () => {
      await action();
      setIsOpen(false);
    });
  }

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-action-title" className="text-lg font-semibold">
          {title}
        </h2>

        <p className="mt-2 text-sm text-(--color-text-secondary)">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => setIsOpen(false)}
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
              variant="destructive"
            >
              {isPending ? "Working..." : confirmLabel}
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
        onClick={() => setIsOpen(true)}
        variant="destructive"
        className="min-w-25"
      >
        {children}
      </Button>

      {isOpen ? createPortal(dialog, document.body) : null}
    </>
  );
}
