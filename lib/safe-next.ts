export function safeNextPath(value: string | null | undefined, fallback = "/share") {
  if (!value) return fallback;

  // Allow only app-internal absolute paths such as /feed or /share?x=1.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.includes("\\") || value.includes("\0")) return fallback;

  return value;
}
