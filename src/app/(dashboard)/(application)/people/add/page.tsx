import { AddPersonTypePage } from "@/features/people/add-person";

// HR Manager — "เพิ่มคนเข้าองค์กร" type picker. Static content only, no
// server data needed — the Employee card links to /people/add/employee,
// which does the real Core-backed fetching.
export default function PeopleAddPage() {
  return <AddPersonTypePage />;
}
