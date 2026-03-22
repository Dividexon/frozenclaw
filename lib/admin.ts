import "server-only";

const adminEmails = new Set(["frozenclaw9@gmail.com"]);

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

export function isAdminEmail(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return adminEmails.has(normalizedEmail);
}
