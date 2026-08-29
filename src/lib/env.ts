import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z.string().min(1).optional(), NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"), ADMIN_PASSWORD: z.string().min(8).default("change-me-now"), AUTH_SECRET: z.string().min(16).default("development-secret-change-me"),
  AI_PROVIDER: z.string().default("openai"), OPENAI_API_KEY: z.string().optional(), OPENAI_MODEL: z.string().default("gpt-5-mini"), INFOFIXHUB_AUTOMATION_TOKEN: z.string().min(32).optional(),
  GEMINI_API_KEY: z.string().optional(), GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
  SCREENSHOTONE_ACCESS_KEY: z.string().optional(),
  KEYWORD_PROVIDER: z.string().default("manual"), KEYWORD_PROVIDER_API_KEY: z.string().optional(), SERP_PROVIDER: z.string().optional(), SERP_PROVIDER_API_KEY: z.string().optional(),
  GOOGLE_TRENDS_ENABLED: z.enum(["true","false"]).default("false"), GOOGLE_ADS_ENABLED: z.enum(["true","false"]).default("false"), GOOGLE_SEARCH_CONSOLE_ENABLED: z.enum(["true","false"]).default("false"),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(), GOOGLE_ADS_CUSTOMER_ID: z.string().optional(), GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_CLIENT_ID: z.string().optional(), GOOGLE_ADS_CLIENT_SECRET: z.string().optional(), GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(), GOOGLE_ADS_API_VERSION: z.string().default("v25"),
  GOOGLE_CLIENT_EMAIL: z.string().optional(), GOOGLE_PRIVATE_KEY: z.string().optional(),
  SERP_CACHE_TTL: z.coerce.number().int().positive().default(259200), PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(10000)
});
export const env = schema.parse(process.env);
