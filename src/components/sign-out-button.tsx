"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button className="nav-button" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
      로그아웃
    </button>
  );
}
