import { SignOutButton } from "@/features/auth/components/SignOutButton";

// Sits in the (auth) group, not (dashboard): the dashboard layout redirects
// here, so living under that layout would loop.
export default function NoAccessPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          บัญชีนี้ยังไม่มีสิทธิ์เข้าใช้งาน
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          คุณเข้าสู่ระบบสำเร็จแล้ว แต่บัญชีนี้ยังไม่ได้อยู่ในองค์กรที่ใช้งาน ThunderOne
          ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ หรือออกจากระบบเพื่อเข้าด้วยบัญชีอื่น
        </p>
      </div>
      <SignOutButton />
    </div>
  );
}
