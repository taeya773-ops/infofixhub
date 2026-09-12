import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return <Link href="/login">로그인/회원가입</Link>;
  }

  return (
    <>
      <Link href="/account">내 계정</Link>
      <SignOutButton />
    </>
  );
}
