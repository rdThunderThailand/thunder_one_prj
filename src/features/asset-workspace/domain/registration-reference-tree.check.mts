import assert from "node:assert/strict";
import { getRegistrationOrgUnits } from "../services/registration-org-unit-tree.ts";
import {
  distinctOrganizationCode, flattenOrganizationTree, referenceTree, searchTree, treePath, treeReference,
  type OrganizationTreeRow,
} from "./registration-reference-tree.ts";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "aaaaaaaa-0000-4000-8000-000000000002";
const C = "AAAAAAAA-0000-4000-8000-000000000003";
const D = "aaaaaaaa-0000-4000-8000-000000000004";
const row = (id: string, name: string, parentId: string | null, status = "Active", isSerialRequired = false) =>
  ({ id, name, code: name.toUpperCase(), parentId, status, isSerialRequired, tag: isSerialRequired ? "Serial" : null });

const tree = referenceTree([
  row(A, "IT Accessory", null),
  row(C, "Mouse", B, "Active", true),
  row(B, "Computer", A),
  row(D, "Old", null, "Inactive"),
]);

assert.deepEqual(tree.children.get("")?.map((item) => item.name), ["IT Accessory"]);
assert.deepEqual(tree.children.get(A)?.map((item) => item.name), ["Computer"]);
assert.equal(tree.byId.has(D), false, "inactive rows are never offered");
assert.deepEqual(treePath(tree, C), [A, B, C.toLowerCase()], "ids are lower-cased and ordered top-down");
assert.deepEqual(treePath(tree, "missing"), []);

const mouse = tree.byId.get(C.toLowerCase())!;
assert.deepEqual(treeReference(tree, mouse, "categories"), {
  id: C.toLowerCase(), name: "Mouse", code: "MOUSE", parent_id: B, parent: { id: B, name: "Computer" }, is_serial_required: true,
});
const site = referenceTree([{ id: A, name: "Site", code: "", parentId: null, status: "Active", isSerialRequired: false, tag: "Building" }]);
assert.deepEqual(treeReference(site, site.byId.get(A)!, "locations"),
  { id: A, name: "Site", code: null, parent_id: null, parent: null, location_type: "Building" });
assert.deepEqual(searchTree(tree, "  mou ").map((item) => item.name), ["Mouse"]);
assert.deepEqual(searchTree(tree, "  "), []);

// Active child of an inactive parent is lifted to the top level; a parent loop does not hang.
const lifted = referenceTree([row(A, "Child", D), row(D, "Gone", null, "Inactive")]);
assert.deepEqual(lifted.children.get("")?.map((item) => item.name), ["Child"]);
const loop = referenceTree([row(A, "One", B), row(B, "Two", A)]);
assert.ok(treePath(loop, A).length <= 2);

const unit = (
  id: string, name: string, code: string, parentId: string | null,
  departmentType: string, status: string, children: OrganizationTreeRow[] = [],
): OrganizationTreeRow => ({ id, name, code, parent_department_id: parentId, department_type: departmentType, status, children });

const organizationData = [
  unit(A, "Operations", " OPS ", null, "Division", "active", [
    unit(B, "Service Desk", "  SERVICE  desk ", A, "Department", "Active", [
      unit(C, "Field Support", "FIELD-1", B, "support_section", "active"),
    ]),
    unit(D, "Old Desk", "OLD", A, "Department", "inactive"),
  ]),
];
const organizationRows = flattenOrganizationTree(organizationData);
assert.deepEqual(organizationRows.map(({ id, parentId }) => [id, parentId]), [[A, null], [B, A], [C, B], [D, A]]);
const organizationTree = referenceTree(organizationRows);
assert.deepEqual([...organizationTree.byId.keys()], [A, B, C.toLowerCase()]);
assert.deepEqual(treePath(organizationTree, C), [A, B, C.toLowerCase()]);
assert.equal(searchTree(organizationTree, "field-1")[0]?.tag, "support section");
assert.deepEqual(searchTree(organizationTree, "old"), []);
const department = organizationTree.byId.get(B)!;
assert.equal(distinctOrganizationCode(department.name, department.code), "");
assert.equal(distinctOrganizationCode("Operations", " OPS "), "OPS");
assert.equal(distinctOrganizationCode("Operations", null), "");
assert.deepEqual(treeReference(organizationTree, department, "orgUnits"), {
  id: B, name: "Service Desk", code: "SERVICE  desk", parent_id: A, parent: { id: A, name: "Operations" },
});

const context = `${A}:${B}`;
const signal = new AbortController().signal;
const fetched = await getRegistrationOrgUnits(context, signal, async (url, init) => {
  assert.equal(url, `/api/proxy/tenants/${A}/organizations`);
  assert.equal(init?.method, "GET");
  assert.equal(init?.credentials, "same-origin");
  return Response.json({ success: true, data: organizationData });
});
assert.deepEqual(fetched, organizationRows);
assert.deepEqual(await getRegistrationOrgUnits(context, signal, async () =>
  Response.json({ success: true, data: [] })), [], "an empty tree does not trigger fallback");
assert.equal(await getRegistrationOrgUnits(context, signal, async () =>
  new Response(null, { status: 403 })), null, "a failed read triggers fallback");
assert.equal(await getRegistrationOrgUnits(context, signal, async () =>
  Response.json({ success: true, data: [{ id: A }] })), null, "incomplete data triggers fallback");

console.log("registration-reference-tree: ok");
