import { NextResponse } from "next/server";
import { z } from "zod";
import { automationError, requireAutomationAuth } from "@/lib/automation-auth";
import { assertDatabaseConfigured, db } from "@/lib/db";

const statusSchema = z.object({
  status: z.enum(["NEW", "SELECTED", "RESEARCHING", "DRAFT", "APPROVED", "REJECTED"]),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const { id } = await context.params;
    const question = await db.question.findUniqueOrThrow({
      where: { id },
      include: { primaryKeyword: true, category: true },
    });
    return NextResponse.json({ question });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAutomationAuth(request);
    assertDatabaseConfigured();
    const { id } = await context.params;
    const { status } = statusSchema.parse(await request.json());
    const question = await db.question.update({ where: { id }, data: { status } });
    return NextResponse.json({ question });
  } catch (error) {
    const result = automationError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
