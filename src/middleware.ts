import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return new NextResponse("Admin credentials are not configured", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      if (atob(auth.slice(6)) === `${adminEmail}:${adminPassword}`) {
        return NextResponse.next();
      }
    } catch {}
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="InfoFixHub Admin"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/discovery/:path*", "/api/content/:path*"],
};
