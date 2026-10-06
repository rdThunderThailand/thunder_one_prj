/** Run: node src/lib/app-locale.check.mts */
import assert from "node:assert/strict";
import { APP_LOCALES, DEFAULT_APP_LOCALE, parseAppLocale } from "./app-locale.ts";

assert.deepEqual([...APP_LOCALES], ["th", "en"]);
assert.equal(DEFAULT_APP_LOCALE, "th");
assert.equal(parseAppLocale("en"), "en");
assert.equal(parseAppLocale("th"), "th");
for (const bad of ["EN", "fr", "", undefined, null, 1, "th; path=/"]) assert.equal(parseAppLocale(bad), null, String(bad));
console.log("app-locale: ok");
