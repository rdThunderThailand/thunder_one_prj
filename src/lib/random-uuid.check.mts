import assert from "node:assert/strict";
import { randomUuid } from "./random-uuid.ts";

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");

try {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { getRandomValues: (bytes: Uint8Array) => bytes },
  });
  assert.equal(randomUuid(), "00000000-0000-4000-8000-000000000000");
} finally {
  Object.defineProperty(globalThis, "crypto", originalCrypto!);
}

console.log("random-uuid.check.mts — all assertions passed");
