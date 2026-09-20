import assert from "node:assert/strict";
import test from "node:test";
import {
  getAccountDeletionResponseDueAt,
  getAccountDeletionStatusLabel,
  isAccountDeletionRequestStatus,
  isOpenAccountDeletionRequestStatus,
} from "./account-deletion";

test("sets the response deadline to one calendar month after the request", () => {
  const requestedAt = new Date("2026-09-20T12:00:00.000Z");

  assert.equal(
    getAccountDeletionResponseDueAt(requestedAt).toISOString(),
    "2026-10-20T12:00:00.000Z",
  );
});

test("handles a request made at the end of a longer month", () => {
  const requestedAt = new Date("2026-01-31T12:00:00.000Z");

  assert.equal(
    getAccountDeletionResponseDueAt(requestedAt).toISOString(),
    "2026-02-28T12:00:00.000Z",
  );
});

test("validates and labels deletion request statuses", () => {
  assert.equal(isAccountDeletionRequestStatus("IN_REVIEW"), true);
  assert.equal(isAccountDeletionRequestStatus("UNKNOWN"), false);
  assert.equal(getAccountDeletionStatusLabel("IN_REVIEW"), "In review");
});

test("only pending and in-review requests are open", () => {
  assert.equal(isOpenAccountDeletionRequestStatus("PENDING"), true);
  assert.equal(isOpenAccountDeletionRequestStatus("IN_REVIEW"), true);
  assert.equal(isOpenAccountDeletionRequestStatus("COMPLETED"), false);
});
