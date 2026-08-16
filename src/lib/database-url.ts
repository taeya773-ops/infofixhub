export function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || null;
}

export function getDatabaseSchema(connectionString = getDatabaseUrl()) {
  if (!connectionString) return undefined;

  try {
    return new URL(connectionString).searchParams.get("schema") ?? undefined;
  } catch {
    return undefined;
  }
}
