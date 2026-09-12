import { getServerSession, type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const providers = [
  env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
    ? Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })
    : null,
  env.AUTH_KAKAO_ID && env.AUTH_KAKAO_SECRET
    ? Kakao({ clientId: env.AUTH_KAKAO_ID, clientSecret: env.AUTH_KAKAO_SECRET })
    : null,
  env.AUTH_NAVER_ID && env.AUTH_NAVER_SECRET
    ? Naver({ clientId: env.AUTH_NAVER_ID, clientSecret: env.AUTH_NAVER_SECRET })
    : null,
].filter((provider) => provider !== null);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as never),
  providers,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  secret: env.AUTH_SECRET,
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string | null }).role;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
