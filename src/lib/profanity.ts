// Simple blocklist-based profanity filter for display names.
// Covers common offensive terms in English and Chinese.
// Can be expanded or replaced with a third-party service later.

const BLOCKED_PATTERNS: RegExp[] = [
  // English slurs & profanity (common subset)
  /\b(fuck|shit|ass|bitch|dick|cock|cunt|nigga|nigger|faggot|retard|whore|slut)\b/i,
  // Chinese profanity (common subset)
  /[幹操肏靠屌雞巴婊賤逼屎尻馬的廢物白癡智障死全家]/,
  // Homoglyphs / leet speak common patterns
  /f[u\*@]ck/i,
  /sh[i1!]t/i,
  /b[i1!]tch/i,
];

export function containsProfanity(text: string): boolean {
  const normalized = text
    .normalize("NFKC")
    .replace(/[\s\-_.]+/g, "")
    .toLowerCase();

  return BLOCKED_PATTERNS.some(
    (pattern) => pattern.test(text) || pattern.test(normalized)
  );
}

export function validateDisplayName(name: string): {
  valid: boolean;
  reason?: string;
} {
  if (name.length < 2) {
    return { valid: false, reason: "Display name must be at least 2 characters" };
  }
  if (name.length > 20) {
    return { valid: false, reason: "Display name must be at most 20 characters" };
  }
  if (containsProfanity(name)) {
    return { valid: false, reason: "Display name contains inappropriate content" };
  }
  // Only allow letters, numbers, CJK characters, spaces, and common symbols
  if (!/^[\p{L}\p{N}\s\-_.]+$/u.test(name)) {
    return {
      valid: false,
      reason: "Display name can only contain letters, numbers, spaces, hyphens, dots, and underscores",
    };
  }
  return { valid: true };
}
