import "next-auth";
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    loginProvider?: unknown;
    verifiedGoogleEmail?: unknown;
  }
}

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
