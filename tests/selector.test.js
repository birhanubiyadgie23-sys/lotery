import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_NAME_LENGTH,
  MAX_PARTICIPANTS,
  parseParticipantNames,
  secureRandomIndex,
} from "../public/selector.js";

test("trims names and ignores blank lines", () => {
  assert.deepEqual(parseParticipantNames("  Hana  \n\n Dawit\n "), ["Hana", "Dawit"]);
});

test("rejects an empty participant list", () => {
  assert.throws(() => parseParticipantNames(" \n  "), /ቢያንስ አንድ/);
});

test("rejects more than the participant limit", () => {
  const input = Array.from({ length: MAX_PARTICIPANTS + 1 }, (_, i) => "Person " + i).join("\n");
  assert.throws(() => parseParticipantNames(input), /ከ100 በላይ/);
});

test("rejects a participant name that exceeds the character limit", () => {
  assert.throws(() => parseParticipantNames("x".repeat(MAX_NAME_LENGTH + 1)), /80 ቁምፊ/);
});

test("selects an index in range with a supplied crypto source", () => {
  const cryptoSource = {
    getRandomValues(buffer) {
      buffer[0] = 7;
      return buffer;
    },
  };
  assert.equal(secureRandomIndex(10, cryptoSource), 7);
});

test("retries values outside the unbiased range", () => {
  const values = [0xffffffff, 7];
  const cryptoSource = {
    getRandomValues(buffer) {
      buffer[0] = values.shift();
      return buffer;
    },
  };
  assert.equal(secureRandomIndex(3, cryptoSource), 1);
  assert.equal(values.length, 0);
});

test("rejects an invalid random range", () => {
  assert.throws(() => secureRandomIndex(0), /max/);
});
