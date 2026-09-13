export type LoginIdentity = {
  loginProvider?: unknown;
  verifiedGoogleEmail?: unknown;
};

// Only populated from the provider's server-validated OAuth profile, never session updates.
export function loginIdentity(provider: string, profile: { email?: unknown; email_verified?: unknown } | undefined): LoginIdentity {
  return {
    loginProvider: provider,
    verifiedGoogleEmail: provider === "google" && profile?.email_verified === true && typeof profile.email === "string"
      ? profile.email.trim().toLowerCase() : null,
  };
}

export function isAdminIdentity(identity: LoginIdentity | null | undefined): boolean {
  const email = process.env.ADMIN_GOOGLE_EMAIL?.trim().toLowerCase();
  const secret = process.env.AUTH_SECRET;
  return Boolean(email && secret && secret.length >= 32 && secret !== "development-secret-change-me"
    && identity?.loginProvider === "google" && identity.verifiedGoogleEmail === email);
}
