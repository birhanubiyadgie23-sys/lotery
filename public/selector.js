export const MAX_PARTICIPANTS = 100;
export const MAX_NAME_LENGTH = 80;

export function parseParticipantNames(input) {
  if (typeof input !== "string") {
    throw new TypeError("የተሳታፊዎች ዝርዝር በጽሑፍ መሆን አለበት።");
  }

  const names = input
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    throw new RangeError("ቢያንስ አንድ ተሳታፊ ያስገቡ።");
  }

  if (names.length > MAX_PARTICIPANTS) {
    throw new RangeError("ከ" + MAX_PARTICIPANTS + " በላይ ተሳታፊዎች ማስገባት አይቻልም።");
  }

  const longName = names.find((name) => Array.from(name).length > MAX_NAME_LENGTH);
  if (longName) {
    throw new RangeError("እያንዳንዱ ስም " + MAX_NAME_LENGTH + " ቁምፊ ወይም ከዚያ በታች መሆን አለበት።");
  }

  return names;
}

/**
 * Returns a uniformly selected integer in [0, max).
 * Rejection sampling avoids modulo bias.
 */
export function secureRandomIndex(max, cryptoSource = globalThis.crypto) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0xffffffff) {
    throw new RangeError("max ትክክለኛ አዎንታዊ ቁጥር መሆን አለበት።");
  }

  if (!cryptoSource || typeof cryptoSource.getRandomValues !== "function") {
    throw new Error("የዘፈቀደ ቁጥር ማመንጫው በዚህ አሳሽ አይደገፍም።");
  }

  const range = 0x100000000;
  const cutoff = Math.floor(range / max) * max;
  const buffer = new Uint32Array(1);

  do {
    cryptoSource.getRandomValues(buffer);
  } while (buffer[0] >= cutoff);

  return buffer[0] % max;
}
