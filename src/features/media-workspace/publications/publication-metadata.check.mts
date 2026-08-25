/**
 * Runnable check for publication metadata (language normalisation):
 *
 *     node src/features/publications/publication-metadata.check.mts
 */
import assert from "node:assert/strict";
import { languageCode, languageLabel, languageOptions } from "./mock-data.ts";
import { basicInfoToForm } from "./draft-mapping.ts";
import type { BasicInfoState } from "./components/BasicInfoForm.tsx";

// 1. Codes pass through unchanged
assert.equal(languageCode("th"), "th");
assert.equal(languageCode("en"), "en");

// 2. Labels persisted by older drafts still normalise to a code
assert.equal(languageCode("Thai"), "th");
assert.equal(languageCode("English"), "en");

// 3. languageLabel accepts either form, so the preview matches the form's select
assert.equal(languageLabel("th"), "Thai");
assert.equal(languageLabel("Thai"), "Thai");
assert.equal(languageLabel("en"), "English");
assert.equal(languageLabel("English"), "English");

// 4. Unknown values survive round-trips instead of being blanked out
assert.equal(languageCode("ja"), "ja");
assert.equal(languageLabel("ja"), "ja");

// 5. Every option round-trips both ways
for (const option of languageOptions) {
  assert.equal(languageCode(option.label), option.code);
  assert.equal(languageLabel(option.code), option.label);
}

// 6. The API payload always carries the code, never the label
const basicInfo: BasicInfoState = {
  campaignId: "camp-1",
  publicationType: "image",
  name: "Summer promo",
  description: "",
  priorityId: "normal",
  language: "Thai",
  tags: ["promo"],
};
assert.equal(basicInfoToForm(basicInfo).language, "th");
assert.equal(basicInfoToForm({ ...basicInfo, language: "en" }).language, "en");

console.log("publication-metadata.check.mts — all assertions passed");
