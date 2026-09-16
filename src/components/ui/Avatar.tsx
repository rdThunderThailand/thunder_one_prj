interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 32, className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      // Font size scales with the circle — a fixed text-xs left large
      // avatars (e.g. ProfilePage's 96px header avatar) with tiny initials.
      // Inline `fontSize` wins over any `text-*` a caller's `className`
      // appends, unlike a plain utility class at equal specificity.
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 ${className}`}
      aria-hidden="true"
    >
      {initials}
      {src && <img src={src} alt="" onError={(event) => { event.currentTarget.hidden = true; }} className="absolute inset-0 h-full w-full object-cover" />}
    </div>
  );
}
