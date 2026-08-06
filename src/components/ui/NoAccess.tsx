import { Card } from "./Card";

export function NoAccess({
  message = "บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ ติดต่อผู้ดูแลระบบหากคิดว่าไม่ถูกต้อง",
}: {
  message?: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
    </Card>
  );
}
