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

type SavedChildForBooking = {
  id: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string;
  allergies: string | null;
  medicalNotes: string | null;
  isEligible: boolean;
  eligibilityReason: string | null;
};

type DefaultParentForBooking = {
  name: string;
  email: string;
  phone: string | null;
};

type BookingFormProps = {
  venueId: string;
  sessionId: string;
  pricePence: number;
  standardPricePence: number;
  memberPricePence: number | null;
  pricingType: "STANDARD" | "MEMBER";
  spacesRemaining: number;
  minAgeYears: number;
  maxAgeYears: number | null;
  defaultParent: DefaultParentForBooking | null;
  savedChildren: SavedChildForBooking[];
  addChildHref: string;
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

function formatChildName(child: SavedChildForBooking) {
  return [child.firstName, child.lastName].filter(Boolean).join(" ");
}

function formatChildDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

export function BookingForm({
  venueId,
  sessionId,
  pricePence,
  standardPricePence,
  memberPricePence,
  pricingType,
  spacesRemaining,
  minAgeYears,
  maxAgeYears,
  defaultParent,
  savedChildren,
  addChildHref,
}: BookingFormProps) {
  const isAccountBooking = defaultParent !== null;
  const hasSavedChildren = savedChildren.length > 0;

  const eligibleSavedChildrenCount = savedChildren.filter(
    (child) => child.isEligible,
  ).length;

  const [parentName, setParentName] = useState(defaultParent?.name ?? "");
  const [parentPhone, setParentPhone] = useState(defaultParent?.phone ?? "");
  const [parentEmail, setParentEmail] = useState(defaultParent?.email ?? "");
  const [confirmParentEmail, setConfirmParentEmail] = useState(
    defaultParent?.email ?? "",
  );

  const [selectedParentChildIds, setSelectedParentChildIds] = useState<
    string[]
  >([]);

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

  const selectedChildCount = isAccountBooking
    ? selectedParentChildIds.length
    : children.length;

  const totalPricePence = useMemo(
    () => selectedChildCount * pricePence,
    [selectedChildCount, pricePence],
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

  function toggleSavedChild(child: SavedChildForBooking) {
    if (!child.isEligible) {
      return;
    }

    setSelectedParentChildIds((current) => {
      if (current.includes(child.id)) {
        return current.filter((id) => id !== child.id);
      }

      if (current.length >= spacesRemaining) {
        return current;
      }

      return [...current, child.id];
    });
  }

  function validateConfirmEmail(input: HTMLInputElement, value: string) {
    const isValid =
      parentEmail.trim().toLowerCase() === value.trim().toLowerCase();

    input.setCustomValidity(isValid ? "" : "Email addresses must match.");
  }

  return (
    <LoadingForm
      action="/api/bookings/create"
      method="POST"
      className="space-y-4"
    >
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input
        type="hidden"
        name="bookingMode"
        value={isAccountBooking ? "account" : "guest"}
      />
      <input
        type="hidden"
        name="childCount"
        value={
          isAccountBooking ? selectedParentChildIds.length : children.length
        }
      />

      {selectedParentChildIds.map((childId) => (
        <input
          key={childId}
          type="hidden"
          name="selectedParentChildIds"
          value={childId}
        />
      ))}

      <section>
        <h2 className="text-lg font-semibold">Parent / guardian details</h2>

        {isAccountBooking ? (
          <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            You are booking from your parent account. Your booking will appear
            in your account dashboard.
          </div>
        ) : (
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Have an account?{" "}
            <Link
              href="/account/login"
              className="font-medium text-(--color-brand-hover) underline"
            >
              Log in
            </Link>{" "}
            to use saved child details.
          </p>
        )}

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
        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Children</h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              {isAccountBooking
                ? "Select the saved children attending this session."
                : "Add each child attending this session."}
            </p>
          </div>

          {isAccountBooking ? (
            <Link
              href={addChildHref}
              className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Add child
            </Link>
          ) : null}
        </div>

        {isAccountBooking ? (
          <div className="mt-4 space-y-4">
            {!hasSavedChildren ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">No saved children yet</p>
                <p className="mt-1">
                  Add a child to your account before booking from your account.
                </p>
                <Link
                  href={addChildHref}
                  className="mt-3 inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Add child
                </Link>
              </div>
            ) : (
              <>
                {eligibleSavedChildrenCount === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-medium">
                      No saved children meet this session’s age requirements
                    </p>
                    <p className="mt-1">
                      This session is for {ageRangeLabel}. Add another child or
                      choose a different session.
                    </p>
                  </div>
                ) : null}

                {savedChildren.map((child) => {
                  const selected = selectedParentChildIds.includes(child.id);
                  const capacityDisabled =
                    !selected &&
                    selectedParentChildIds.length >= spacesRemaining;

                  const disabled = !child.isEligible || capacityDisabled;

                  return (
                    <label
                      key={child.id}
                      className={`block rounded-lg border p-4 text-sm ${
                        selected
                          ? "border-black bg-gray-50"
                          : "border-gray-200 bg-[#fdfdfd]"
                      } ${disabled ? "opacity-55" : "cursor-pointer"}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={disabled}
                          onChange={() => toggleSavedChild(child)}
                          className="mt-1"
                        />

                        <div>
                          <p className="font-medium text-gray-900">
                            {formatChildName(child)}
                          </p>
                          <p className="mt-1 text-gray-600">
                            Date of birth: {formatChildDate(child.dateOfBirth)}
                          </p>
                          <p className="mt-1 text-gray-600">
                            Allergies: {child.allergies || "—"}
                          </p>
                          <p className="mt-1 text-gray-600">
                            Medical notes: {child.medicalNotes || "—"}
                          </p>

                          {!child.isEligible ? (
                            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                              {child.eligibilityReason}
                            </p>
                          ) : null}

                          {capacityDisabled ? (
                            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                              No more spaces can be selected for this session.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </>
            )}

            {selectedParentChildIds.length >= spacesRemaining && (
              <p className="text-sm text-(--color-warning)">
                You have selected all remaining spaces for this session.
              </p>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-gray-200 bg-[#fdfdfd] p-4">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-(--color-text-secondary)">Children</span>
          <span className="font-medium">{selectedChildCount}</span>
        </div>

        <div className="mt-2 flex justify-between gap-4 text-sm">
          <span className="text-(--color-text-secondary)">Standard price</span>
          <span className="font-medium">{formatPrice(standardPricePence)}</span>
        </div>

        {memberPricePence !== null ? (
          <div className="mt-2 flex justify-between gap-4 text-sm">
            <span className="text-(--color-text-secondary)">Member price</span>
            <span className="font-medium">{formatPrice(memberPricePence)}</span>
          </div>
        ) : null}

        <div className="mt-2 flex justify-between gap-4 text-sm">
          <span className="text-(--color-text-secondary)">Price applied</span>
          <span className="font-medium">
            {formatPrice(pricePence)}{" "}
            {pricingType === "MEMBER" ? "(member)" : "(standard)"}
          </span>
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

        <ApiSubmitButton
          type="submit"
          className="mt-2 w-full"
          disabled={isAccountBooking && selectedParentChildIds.length === 0}
        >
          Continue to payment
        </ApiSubmitButton>
      </section>
    </LoadingForm>
  );
}
