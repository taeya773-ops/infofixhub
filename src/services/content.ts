import { assertDatabaseConfigured, db } from "@/lib/db";
import { evaluateQuality } from "@/lib/quality";
import { slugify } from "@/lib/slug";
import { OpenAIProvider } from "./ai";

function markdownToSafeHtml(md: string) {
  return md
    .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
    .replace(/\n/g, "<br>");
}

export async function generateContentForKeyword(keywordId: string) {
  assertDatabaseConfigured();

  const keyword = await db.keyword.findUniqueOrThrow({
    where: { id: keywordId },
    include: { primaryClusters: true },
  });
  const provider = new OpenAIProvider();
  const question = await db.question.create({
    data: {
      primaryKeywordId: keyword.id,
      keywordClusterId: keyword.primaryClusters[0]?.id,
      categoryId: keyword.categoryId,
      title: `${keyword.keyword}에 대해 알아야 할 것`,
      slug: `${slugify(keyword.keyword)}-${Date.now().toString(36)}`,
      searchIntent: "informational",
      language: keyword.language,
      country: keyword.country,
      status: "GENERATING",
    },
  });
  const job = await db.generationJob.create({
    data: {
      questionId: question.id,
      status: "RUNNING",
      provider: "openai",
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
      startedAt: new Date(),
    },
  });

  try {
    const content = await provider.generateContent({
      keyword: keyword.keyword,
      intent: "informational",
    });
    const quality = evaluateQuality(content);

    await db.$transaction([
      db.answer.create({
        data: {
          questionId: question.id,
          summary: content.summary,
          contentMarkdown: content.answer,
          contentHtml: markdownToSafeHtml(content.answer),
          provider: "openai",
          model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
          promptVersion: "v1",
          confidenceScore: content.confidenceScore,
          qualityScore: quality.score,
        },
      }),
      db.seoMetadata.create({
        data: {
          questionId: question.id,
          title: content.seo.title,
          description: content.seo.description,
        },
      }),
      db.question.update({
        where: { id: question.id },
        data: {
          title: content.title,
          searchIntent: content.searchIntent,
          qualityScore: quality.score,
          status: quality.decision === "REJECT" ? "REJECTED" : "REVIEW",
        },
      }),
      db.generationJob.update({
        where: { id: job.id },
        data: { status: "SUCCESS", finishedAt: new Date() },
      }),
      db.keyword.update({
        where: { id: keyword.id },
        data: { status: "CONTENT_CREATED" },
      }),
    ]);

    return question.id;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Content generation failed";

    await db.$transaction([
      db.question.update({
        where: { id: question.id },
        data: { status: "DRAFT" },
      }),
      db.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: errorMessage.slice(0, 1000),
          finishedAt: new Date(),
        },
      }),
    ]);
    throw error;
  }
}

export async function publishQuestion(questionId: string, userId?: string) {
  assertDatabaseConfigured();

  const q = await db.question.findUniqueOrThrow({
    where: { id: questionId },
    include: { answers: { where: { isActive: true }, take: 1 } },
  });

  if (!q.answers[0] || q.answers[0].qualityScore < 60) {
    throw new Error("Quality threshold not met");
  }

  return db.$transaction([
    db.question.update({
      where: { id: questionId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    }),
    db.keyword.update({
      where: { id: q.primaryKeywordId },
      data: { status: "PUBLISHED" },
    }),
    db.auditLog.create({
      data: {
        userId,
        action: "QUESTION_PUBLISHED",
        entityType: "Question",
        entityId: questionId,
      },
    }),
  ]);
}
