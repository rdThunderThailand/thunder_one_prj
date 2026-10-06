/** Run: node src/lib/app-locale.check.mts */
import assert from "node:assert/strict";
import { APP_LOCALES, DEFAULT_APP_LOCALE, LANGUAGE_TAG, languageFromTag, parseAppLocale, resolveAppLocale } from "./app-locale.ts";

assert.deepEqual([...APP_LOCALES], ["th", "en"]);
assert.equal(DEFAULT_APP_LOCALE, "th");
assert.equal(parseAppLocale("en"), "en");
assert.equal(parseAppLocale("th"), "th");
for (const bad of ["EN", "fr", "", undefined, null, 1, "th; path=/"]) assert.equal(parseAppLocale(bad), null, String(bad));

// Database values: users.preferred_language ("th"), tenants.locale ("th-TH"), other spellings.
assert.equal(languageFromTag("th"), "th");
assert.equal(languageFromTag("th-TH"), "th");
assert.equal(languageFromTag("en_US"), "en");
assert.equal(languageFromTag(" EN "), "en");
for (const bad of ["fr-FR", "", null, undefined, 3, "-"]) assert.equal(languageFromTag(bad), null, String(bad));

// What the app writes to users.preferred_language reads back as the same locale.
assert.deepEqual(LANGUAGE_TAG, { th: "th-TH", en: "en-US" });
for (const l of APP_LOCALES) assert.equal(languageFromTag(LANGUAGE_TAG[l]), l);

// Order: device choice → user preference → tenant locale → Thai.
assert.equal(resolveAppLocale({ device: "en", user: "th", tenant: "th-TH" }), "en");
assert.equal(resolveAppLocale({ user: "en", tenant: "th-TH" }), "en");
assert.equal(resolveAppLocale({ device: "fr", user: "en" }), "en");
assert.equal(resolveAppLocale({ user: "ja", tenant: "en-US" }), "en");
assert.equal(resolveAppLocale({}), "th");

console.log("app-locale: ok");
