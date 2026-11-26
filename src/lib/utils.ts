import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only guesses t-shirt names (`text-2xs`); without this it reads the project's
// `text-ui` size (globals.css) as a text colour and drops one of the two.
const twMerge = extendTailwindMerge({ extend: { theme: { text: ["ui"] } } });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
