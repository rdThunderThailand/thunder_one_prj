// 2026-09-16 homepage redesign — replaces the old StrategicHeader.tsx
// ("Good morning, {name}" + a Customize button, neither in the new mockup).
// The mockup's header is a hero banner over a skyline photo; this app has no
// such image asset, so it's a gradient card instead — same visual intent
// (a distinct, branded top band) without inventing an image source.
export function HomeHeader({ userName }: { userName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 text-white shadow-sm">
      <div className="relative z-10 max-w-lg">
        <h1 className="text-2xl font-semibold">สวัสดีครับ คุณ{userName}</h1>
        <p className="mt-1 text-sm text-indigo-100">นี่คือสิ่งสำคัญสำหรับวันนี้</p>
      </div>
      <p className="relative z-10 mt-6 text-right text-lg font-semibold leading-tight sm:text-xl">
        Empowered People.
        <br />
        <span className="text-white">Connected Organization.</span>
      </p>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.18),transparent_55%)]" />
    </div>
  );
}
