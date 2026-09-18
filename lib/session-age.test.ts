import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SESSION_MIN_AGE,
  getSessionMinimumAge,
} from "./session-age";

test("sessions without a configured minimum age default to age 0", () => {
  assert.equal(DEFAULT_SESSION_MIN_AGE, 0);
  assert.equal(getSessionMinimumAge(null), 0);
  assert.equal(getSessionMinimumAge(undefined), 0);
});

test("a configured session minimum age takes precedence over the default", () => {
  assert.equal(getSessionMinimumAge(0), 0);
  assert.equal(getSessionMinimumAge(1), 1);
  assert.equal(getSessionMinimumAge(4), 4);
});
