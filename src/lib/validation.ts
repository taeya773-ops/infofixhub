import { z } from "zod";
export const seedInputSchema = z.object({ categoryId:z.string().min(1), keyword:z.string().trim().min(2).max(160), country:z.string().length(2).default("KR"), language:z.string().min(2).max(5).default("ko") });
export const keywordActionSchema = z.object({ keywordId:z.string().min(1), action:z.enum(["analyze","select","cluster","generate","reject"]) });
export const publishSchema = z.object({ questionId:z.string().min(1), title:z.string().trim().min(8).max(180).optional(), contentMarkdown:z.string().min(100).optional() });
export const generatedContentSchema = z.object({ searchIntent:z.string(), title:z.string().min(8), summary:z.string().min(20), answer:z.string().min(100), steps:z.array(z.object({title:z.string(),description:z.string()})), relatedQuestions:z.array(z.string()), topics:z.array(z.string()), adContext:z.object({categories:z.array(z.string()),keywords:z.array(z.string()),intent:z.string()}), seo:z.object({title:z.string(),description:z.string()}), confidenceScore:z.number().min(0).max(100) });
export type GeneratedContent = z.infer<typeof generatedContentSchema>;
