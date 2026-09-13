import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") notFound();
  return session;
}

export async function adminApiDenied() {
  const session = await auth();
  return session?.user?.role === "ADMIN" ? null : Response.json(
    { error: "관리자 Google 로그인이 필요합니다." },
    { status: session?.user ? 403 : 401, headers: { "Cache-Control": "no-store" } },
  );
}
