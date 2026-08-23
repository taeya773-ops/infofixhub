import { timingSafeEqual } from "node:crypto";

export function requireAutomationAuth(request: Request) {
  const expected = process.env.INFOFIXHUB_AUTOMATION_TOKEN;
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!expected || !provided) throw new Error("UNAUTHORIZED");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("UNAUTHORIZED");
  }
}

export function automationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  return {
    message,
    status: message === "UNAUTHORIZED" ? 401 : 400,
  };
}
