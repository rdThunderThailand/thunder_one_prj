/** What the Create wizard's Cancel asks and reports (ADR 0124 §4–§5). `null` means no confirm, no toast. */
export function createExitPlan({ isDirty, hasServerDraft }: { isDirty: boolean; hasServerDraft: boolean }) {
  if (!isDirty) return { confirm: null, toast: null };
  return hasServerDraft
    ? {
        confirm: "การแก้ไขที่ยังไม่บันทึกจะหายไปและกู้คืนไม่ได้ ส่วนที่บันทึกไว้แล้วไม่ถูกแตะ",
        toast: "ทิ้งการแก้ไขที่ยังไม่บันทึกแล้ว",
      }
    : {
        confirm: "คอนเทนต์ที่เลือก รวมถึงชื่อ คำอธิบาย และแท็กที่กรอกไว้ จะหายไปและกู้คืนไม่ได้",
        toast: "ทิ้ง draft แล้ว",
      };
}
