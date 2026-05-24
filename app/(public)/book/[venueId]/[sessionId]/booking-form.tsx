"use client";

import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/form-field";
import { yearsAgoInputValue } from "@/lib/date-time";
import { formatAgeRequirement, formatPrice } from "@/lib/formatters";
import { useMemo, useState } from "react";
import Link from "next/link";
import { LoadingForm } from "@/components/ui/loading-form";
import { ApiSubmitButton } from "@/components/ui/api-submit-button";

type ChildFormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string;
  hasNoAllergies: boolean;
  medicalNotes: string;
  hasNoMedicalNotes: boolean;
};

type BookingFormProps = {
  venueId: string;
  sessionId: string;
  pricePence: number;
  spacesRemaining: number;
  minAgeYears: number;
  maxAgeYears: number | null;
};

function createEmptyChild(): ChildFormState {
  return {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    allergies: "",
    hasNoAllergies: false,
    medicalNotes: "",
    hasNoMedicalNotes: false,
  };
}

const PHONE_PATTERN = "[+()0-9\\s-]{7,20}";

export function BookingForm({
  venueId,
  sessionId,
  pricePence,
  spacesRemaining,
  minAgeYears,
  maxAgeYears,
}: BookingFormProps) {
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [confirmParentEmail, setConfirmParentEmail] = useState("");

  const [children, setChildren] = useState<ChildFormState[]>([
    createEmptyChild(),
  ]);

  const latestAllowedDateOfBirth = useMemo(
    () => yearsAgoInputValue(minAgeYears),
    [minAgeYears],
  );

  const earliestAllowedDateOfBirth = useMemo(
    () => (maxAgeYears === null ? undefined : yearsAgoInputValue(maxAgeYears)),
    [maxAgeYears],
  );

  const ageRangeLabel = useMemo(
    () => formatAgeRequirement(minAgeYears, maxAgeYears),
    [minAgeYears, maxAgeYears],
  );

  const totalPricePence = useMemo(
    () => children.length * pricePence,
    [children.length, pricePence],
  );

  const emailsDoNotMatch =
    confirmParentEmail.length > 0 &&
    parentEmail.toLowerCase() !== confirmParentEmail.toLowerCase();

  function addChild() {
    if (children.length >= spacesRemaining) {
      return;
    }

    setChildren((current) => [...current, createEmptyChild()]);
  }

  function removeChild(indexToRemove: number) {
    setChildren((current) =>
      current.length === 1
        ? current
        : current.filter((_, index) => index !== indexToRemove),
    );
  }

  function updateChild(
    indexToUpdate: number,
    field: keyof ChildFormState,
    value: string | boolean,
  ) {
    setChildren((current) =>
      current.map((child, index) =>
        index === indexToUpdate ? { ...child, [field]: value } : child,
      ),
    );
  }

  function validateConfirmEmail(input: HTMLInputElement, value: string) {
    const isValid =
      parentEmail.trim().toLowerCase() === value.trim().toLowerCase();

    input.setCustomValidity(isValid ? "" : "Email addresses must match.");
  }

  return (
    <LoadingForm action="/api/bookings/create" method="POST" className="space-y-4">
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="childCount" value={children.length} />

      <section>
        <h2 className="text-lg font-semibold">Parent / guardian details</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <InputField
            label="Parent / guardian name"
            name="parentName"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={parentName}
            onChange={(event) => setParentName(event.target.value)}
          />

          <InputField
            label="Parent / guardian phone"
            name="parentPhone"
            type="tel"
            required
            minLength={7}
            maxLength={20}
            pattern={PHONE_PATTERN}
            title="Enter a valid phone number using numbers, spaces, +, -, or brackets."
            autoComplete="tel"
            inputMode="tel"
            value={parentPhone}
            onChange={(event) => setParentPhone(event.target.value)}
          />

          <InputField
            label="Parent / guardian email"
            name="parentEmail"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={parentEmail}
            onChange={(event) => {
              setParentEmail(event.target.value);
              setConfirmParentEmail("");
            }}
            className={emailsDoNotMatch ? "border-(--color-danger)!" : ""}
          />

          <InputField
            label="Confirm email"
            name="confirmParentEmail"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={confirmParentEmail}
            onChange={(event) => {
              const value = event.target.value;
              setConfirmParentEmail(value);
              validateConfirmEmail(event.target, value);
            }}
            onBlur={(event) =>
              validateConfirmEmail(event.target, event.target.value)
            }
            className={emailsDoNotMatch ? "border-(--color-danger)!" : ""}
          />
        </div>

        <div className="mt-1 h-4">
          {emailsDoNotMatch ? (
            <p className="text-xs text-(--color-danger)">
              Email addresses do not match.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Children</h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Add each child attending this session.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-6">
          {children.map((child, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-[#fdfdfd] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="h-7 font-medium">Child {index + 1}</h3>

                {children.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeChild(index)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="First name"
                  name={`children[${index}][firstName]`}
                  type="text"
                  required
                  minLength={1}
                  maxLength={50}
                  autoComplete="given-name"
                  value={child.firstName}
                  onChange={(event) =>
                    updateChild(index, "firstName", event.target.value)
                  }
                />

                <InputField
                  label="Last name"
                  name={`children[${index}][lastName]`}
                  type="text"
                  required
                  minLength={1}
                  maxLength={50}
                  autoComplete="family-name"
                  value={child.lastName}
                  onChange={(event) =>
                    updateChild(index, "lastName", event.target.value)
                  }
                />

                <InputField
                  label="Date of birth"
                  name={`children[${index}][dateOfBirth]`}
                  type="date"
                  required
                  min={earliestAllowedDateOfBirth}
                  max={latestAllowedDateOfBirth}
                  value={child.dateOfBirth}
                  onChange={(event) =>
                    updateChild(index, "dateOfBirth", event.target.value)
                  }
                  hint={ageRangeLabel}
                />

                <div>
                  <InputField
                    label="Allergies"
                    name={`children[${index}][allergies]`}
                    type="text"
                    required={!child.hasNoAllergies}
                    minLength={2}
                    maxLength={250}
                    value={child.allergies}
                    onChange={(event) =>
                      updateChild(index, "allergies", event.target.value)
                    }
                    disabled={child.hasNoAllergies}
                    placeholder={
                      child.hasNoAllergies ? "No allergies" : "E.g. peanuts"
                    }
                  />

                  {child.hasNoAllergies && (
                    <input
                      type="hidden"
                      name={`children[${index}][allergies]`}
                      value="None"
                    />
                  )}

                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-(--color-text-secondary)">
                    <input
                      type="checkbox"
                      checked={child.hasNoAllergies}
                      onChange={(event) => {
                        updateChild(
                          index,
                          "hasNoAllergies",
                          event.target.checked,
                        );

                        if (event.target.checked) {
                          updateChild(index, "allergies", "");
                        }
                      }}
                    />
                    No allergies
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <InputField
                    label="Medical notes"
                    name={`children[${index}][medicalNotes]`}
                    id={`children.${index}.medicalNotes`}
                    type="text"
                    required={!child.hasNoMedicalNotes}
                    minLength={2}
                    maxLength={400}
                    placeholder={
                      child.hasNoMedicalNotes
                        ? "No Medical notes"
                        : "Medical, behavioural or other important notes"
                    }
                    value={child.medicalNotes}
                    onChange={(event) =>
                      updateChild(index, "medicalNotes", event.target.value)
                    }
                    disabled={child.hasNoMedicalNotes}
                  />

                  {child.hasNoMedicalNotes && (
                    <input
                      type="hidden"
                      name={`children[${index}][medicalNotes]`}
                      value="None"
                    />
                  )}

                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-(--color-text-secondary)">
                    <input
                      type="checkbox"
                      checked={child.hasNoMedicalNotes}
                      onChange={(event) => {
                        updateChild(
                          index,
                          "hasNoMedicalNotes",
                          event.target.checked,
                        );

                        if (event.target.checked) {
                          updateChild(index, "medicalNotes", "");
                        }
                      }}
                    />
                    No medical notes
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={addChild}
          disabled={children.length >= spacesRemaining}
          variant="secondary"
          className="mt-8 w-full"
        >
          Add child
        </Button>

        {children.length >= spacesRemaining && (
          <p className="mt-3 text-sm text-(--color-warning)">
            You have selected all remaining spaces for this session.
          </p>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-[#fdfdfd] p-4">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-(--color-text-secondary)">Children</span>
          <span className="font-medium">{children.length}</span>
        </div>

        <div className="mt-2 flex justify-between gap-4 text-sm">
          <span className="text-(--color-text-secondary)">Price per child</span>
          <span className="font-medium">{formatPrice(pricePence)}</span>
        </div>

        <div className="mt-3 flex justify-between gap-4 border-t border-gray-200 pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-semibold">{formatPrice(totalPricePence)}</span>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <label className="flex cursor-pointer gap-2 text-sm text-(--color-text-secondary)">
          <input name="consentAccepted" type="checkbox" required />
          <span>
            I confirm I am the parent/guardian, consent to my child attending
            and receiving first aid treatment if required, confirm the
            information provided is accurate, and accept the{" "}
            <Link
              className="text-(--color-brand-hover) underline"
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms & Conditions
            </Link>
            .<span className="text-(--color-danger)">*</span>
          </span>
        </label>

        <label className="flex cursor-pointer gap-2 text-sm text-(--color-text-secondary)">
          <input name="marketingOptIn" type="checkbox" />
          <span>I would like to receive updates about future sessions.</span>
        </label>

        <ApiSubmitButton type="submit" className="mt-2 w-full">
          Continue to payment
        </ApiSubmitButton>
      </section>
    </LoadingForm>
  );
}
