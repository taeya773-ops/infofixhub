import { auth } from "@/auth";

export async function isAdminRequest() {
  return (await auth())?.user?.role === "ADMIN";
}
