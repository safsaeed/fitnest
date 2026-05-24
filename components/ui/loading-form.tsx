"use client";

import * as React from "react";

const LoadingFormContext = React.createContext(false);

type LoadingFormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  children: React.ReactNode;
};

export function LoadingForm({
  children,
  onSubmit,
  ...props
}: LoadingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <form
      {...props}
      onSubmit={(event) => {
        setIsSubmitting(true);
        onSubmit?.(event);
      }}
    >
      <LoadingFormContext.Provider value={isSubmitting}>
        {children}
      </LoadingFormContext.Provider>
    </form>
  );
}

export function useLoadingForm() {
  return React.useContext(LoadingFormContext);
}
