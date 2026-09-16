// 2026-09-16 — now just the greeting text; the skyline photo + gradient
// backdrop moved up to `MissionControlPage.tsx`'s wrapping container so the
// same image can bleed behind the top of the cards below too (see that
// file's comment). Text color switched from white to navy to match the
// mockup — the real background here is a light sky photo, not the old
// solid indigo gradient, so navy text is what actually reads.
export function HomeHeader({ userName }: { userName: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-14 pt-8">
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold text-[#071858]">สวัสดีครับ คุณ{userName}</h1>
        <p className="mt-1 text-sm text-[#4b5d8a]">นี่คือสิ่งสำคัญสำหรับวันนี้</p>
      </div>
      <p className="text-right text-lg font-semibold leading-tight text-[#071858] sm:text-xl">
        Empowered People.
        <br />
        <span className="text-[#0760ed]">Connected Organization.</span>
      </p>
    </div>
  );
}
