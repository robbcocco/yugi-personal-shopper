import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractLastPathSegment(input: string): string {
  let s = input.trim().replace(/^['"]|['"]$/g, ""); // strip quotes
  // Try absolute URL
  try {
    const u = new URL(s);
    s = u.pathname;
  } catch {
    // Try domain/path without protocol (e.g., ygoprodeck.com/collection/...)
    if (!s.startsWith("/") && /[.:]/.test(s)) {
      try {
        const u = new URL("https://" + s);
        s = u.pathname;
      } catch {
        // fall through
      }
    }
  }
  s = s.replace(/\/+$/, ""); // drop trailing slashes
  const last = s.split("/").filter(Boolean).pop() ?? s;
  return decodeURIComponent(last.split("?")[0].split("#")[0]);
}
