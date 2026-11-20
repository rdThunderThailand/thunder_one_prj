# Workspace profile: <Workspace name> (`<key>`)

Copy this file to `references/workspaces/<key>.md`, fill every section, and add `<key>` to the list in SKILL.md Step 0.
A profile adds to the core (SKILL.md). It never overrides a DS-xx rule; if the design needs that, raise it in `open-decisions.md`.

Product truth: <Product Definition name + version>, <Product Specification name + version>.
Design source: <Figma file name, file key, page/node>, status <DESIGN APPROVED / IN PROGRESS>.
Code (optional): `@rdthunderthailand/thunderone-theme/workspaces/<key>` exporting `<key>Status` and `<Key>Icon`.

## Vocabulary (use these exact terms)
- <Object> = <meaning>. Use the same terms as the Product Spec and the approved UI.

## Navigation (fixed order)
<Primary item> · <Group> (<items>) · …
(Platform utilities such as Help or Notifications are not added here.)

## Status mapping (DS-04)
| <Workspace> state | Semantic token | antd Badge |
|---|---|---|
| <State> | `status.success / warning / error / info / in-progress` | success / warning / error / processing |

Lifecycle states that end users never see do not need a color.

## Icon map (in addition to `T1Icon`)
| Concept | Key | React |
|---|---|---|
| <Concept> | `<key>` | `<XxxOutlined />` |
Check the icon exists in `assets/icons/antd-outlined-icons.txt` and does not remap a platform concept.

## Pages
<Screen ID> <name>: <which core pattern, what is specific>.

## Table column drop order (narrow cards)
<lowest priority first, with breakpoints>

## Workspace components
| Component | Spec |
|---|---|

## Open items
<links to open-decisions.md entries>
