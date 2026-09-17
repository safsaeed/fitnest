import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import { parseBookingFormData } from "./booking-validation";

function createValidGuestBookingForm() {
  const formData = new FormData();

  formData.set("venueId", "venue-1");
  formData.set("sessionId", "session-1");
  formData.set("bookingMode", "guest");
  formData.set("childCount", "1");
  formData.set("parentName", "Taylor Parent");
  formData.set("parentEmail", "taylor@example.com");
  formData.set("parentPhone", "07123 456789");
  formData.set("emergencyContactName", "Morgan Contact");
  formData.set("emergencyContactPhone", "07987 654321");
  formData.set("consentAccepted", "on");
  formData.set("children[0][firstName]", "Alex");
  formData.set("children[0][lastName]", "Parent");
  formData.set("children[0][dateOfBirth]", "2020-01-01");
  formData.set("children[0][allergies]", "None");
  formData.set("children[0][medicalNotes]", "None");

  return formData;
}

function assertValidationIssue(
  formData: FormData,
  path: string,
  message: string,
) {
  assert.throws(
    () => parseBookingFormData(formData),
    (error) => {
      assert.ok(error instanceof ZodError);
      assert.ok(
        error.issues.some(
          (issue) => issue.path.join(".") === path && issue.message === message,
        ),
      );
      return true;
    },
  );
}

test("requires and returns emergency contact details for a booking", () => {
  const input = parseBookingFormData(createValidGuestBookingForm());

  assert.equal(input.emergencyContactName, "Morgan Contact");
  assert.equal(input.emergencyContactPhone, "07987 654321");
});

test("rejects a booking without an emergency contact name", () => {
  const formData = createValidGuestBookingForm();
  formData.delete("emergencyContactName");

  assertValidationIssue(
    formData,
    "emergencyContactName",
    "Emergency contact name is required.",
  );
});

test("rejects a booking without an emergency contact phone number", () => {
  const formData = createValidGuestBookingForm();
  formData.delete("emergencyContactPhone");

  assertValidationIssue(
    formData,
    "emergencyContactPhone",
    "Emergency contact phone number is required.",
  );
});

test("rejects an invalid emergency contact phone number", () => {
  const formData = createValidGuestBookingForm();
  formData.set("emergencyContactPhone", "not-a-phone");

  assertValidationIssue(
    formData,
    "emergencyContactPhone",
    "Enter a valid emergency contact phone number using numbers, spaces, +, -, or brackets.",
  );
});
