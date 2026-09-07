# Insert to Layout panel plan

## Goal

Match the supplied Figma hierarchy and Playlist editor structure: staged content shelf on the left, canvas in the middle, switchable Layout/Zone properties on the right, and Zone Overview below.

## Changes

1. Keep `ZoneContentPicker` in the editor's full-height left column and move both Media and Playlist browsing into its picker drawer.
2. Stage picked content in the shelf; preserve existing binding rules and mutate the Zone only after the explicit insert action.
3. Put Split Zone in the icon-labelled canvas toolbar.
4. Switch the right panel between Layout properties and the selected Zone's Layout/Behavior properties.
5. Put Zone Overview below the three-column workspace and summarize Layout metadata in header badges.

## Verification

- Run the Zone binding check, focused ESLint, TypeScript, and `git diff --check`.
- Verify the three-column position and left drawer in the browser after the required user verification choice.
