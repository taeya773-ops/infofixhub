import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminIdentity } from "@/lib/admin-policy";

export async function middleware(request: NextRequest) {
  const token = process.env.AUTH_SECRET
    ? await getToken({ req: request, secret: process.env.AUTH_SECRET }) : null;
  if (isAdminIdentity(token)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: token ? 403 : 401 });
  }
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/discovery/:path*", "/api/content/:path*"],
};
