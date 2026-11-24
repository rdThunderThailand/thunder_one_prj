# Restore original shared Input appearance —2026-11-14

PR387 head24556c8ddc82378c4fc8c10910c7ef4512ede758. Owner requested the old
Login field appearance for every shared Input default and selected agent preview checks.
ADR0113 supersedes the32px visual default; single renderer and TextField API stay.

Source: canonicalInput restoredroundedlg12px, px14/py10, font14/line20, bgcard,
borderborder, no shadow, primary focusborder/ring2. TextField/SearchInput inherit it;
legacyInput remains a re-export. Six explicit h8/h9 controls acrossfivefiles keep py1.
Nativeprops/ref/errorARIA/disabled/filemetadata retained. No generatedtheme edits.

Checks: existing shared-ui.check redonmissingroundedlg beforeprodedit, greenafter;
Modal/theme-copy checks, typecheck, targetedESLint andwhitespacechecks pass.
Independent source review:ship, no lostnative/ref/ARIA/overridebehavior found.
Commit24556c8d pushed; Vercel build andPreviewComments pass.

Hosted Login at1440×1000,390×844 and320×844: email/password42px, radius12px,
padding10px14px, font14px, unfocusedbox-shadow none; documentwidth equalsviewport.
Clicking Email label focuses actualinput; focusedborder rgb40,110,249 and2px
primary30 ring observed. No credentials entered/submitted.

Owner renewed the ThunderOne login after the first redirect. Inner hosted verification
completed on the same24556c8d preview:

- Playback Proof SearchInput42px/font14/no-shadow; decorative iconcenter offset0px.
  Synthetic search query produces No entries match these filters after the page's
  debounce/backendread; clearing restores50 rows. An earlier immediate row reading
  before debounce was discarded, not treated as a filtering verdict.
- Custom range reveals From/To native date inputs:36px high,144px wide, padding4px14px,
  font14 at1440/390/320px. Fromfocus works; native date text/calendarbutton visuallyfit.
  No date value was changed or Apply clicked. No documenthorizontaloverflow at these widths.
- Player releases Newrelease file input:42px high,padding10px14px,font14,no-shadow;
  type=file/multiple attributes retained. At1440/390/320px file widths462/340/270px;
  dialogclient/scroll widths510/510,388/388,318/318. Native chooser label fits;
  no chooser opened, file selected or upload submitted. Escape closes and returnsfocus
  to Newrelease. Date/file checks establish rendering/focus, not fullnativeOSpicker behavior.
- Viewportoverride reset and test search cleared. No serverdatawrites.

- [auth-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-restored-input-auth-1440.jpg)
- [auth-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-restored-input-auth-390.jpg)
- [date-1440](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-restored-input-date-1440.jpg)
- [date-390](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-restored-input-date-390.jpg)
- [file-mobile](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-restored-input-file-mobile.jpg)

- [Native input measurement data](/Users/arty/.codex/visualizations/2026/11/13/01a1d440-a52f-7740-8f8c-e2036924ec23/pr387-restored-input-native-measurements.json)

No data write, file selection/upload, Ready change ormerge.

Coverage limit: the otherfourcompacttextcallers were inventoried/reviewed in source, not individually opened in browser. No physicalmobile/all-importer/fullupload verification.
