# Search Demand Intelligence Platform

Search Traffic Intelligence, Content, and Advertising MVP built with Next.js, Prisma 7, and PostgreSQL.

## Phase 1 Database Setup

This project uses a real PostgreSQL database through Prisma. Production flow must not use an in-memory repository, mock database, or static sample repository. Test fixtures are allowed only inside tests.

### 1. Create PostgreSQL

Create a PostgreSQL database with a user that can create tables, indexes, enums, and foreign keys.

### 2. Configure DATABASE_URL

Copy `.env.example` to `.env` and set the required values. Keep secrets in `.env` or your deployment secret manager, not in source code.

```env
DATABASE_URL=
NEXT_PUBLIC_SITE_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
AUTH_SECRET=
```

For the current production domain, use the apex domain as the canonical site URL:

```env
NEXT_PUBLIC_SITE_URL=https://infofixhub.org
```

Connect both domains at the hosting/DNS layer:

- `infofixhub.org`
- `www.infofixhub.org`

Use `https://infofixhub.org` as the canonical URL and redirect `https://www.infofixhub.org` to it when the hosting provider supports domain redirects.

For this Supabase project, keep the existing `public` schema untouched and use the app-owned schema:

```env
DATABASE_URL="postgresql://postgres.xkyrzmrsgltyucbnxurc:YOUR_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?schema=search_intel"
```

The direct host was not reachable from this environment, and the transaction pooler is not appropriate for Prisma migrations. The session pooler on port `5432` was verified for this project.

Optional provider credentials such as `OPENAI_API_KEY`, Google Ads, Search Console, or SERP provider keys are not required for database migration, seed, app boot, lint, typecheck, tests, or build. Provider-specific features fail only when those providers are called without credentials.

### 3. Prisma Generate

```bash
npm run db:generate
```

### 4. Migration

For local development:

```bash
npm run db:migrate
```

For production or deployed environments:

```bash
npm run db:deploy
```

The initial migration is stored at `prisma/migrations/20260815000000_init/migration.sql`.

### 5. Seed

```bash
npm run db:seed
```

The seed is idempotent for the core verification records and can be run repeatedly without creating duplicate Category, SeedTopic, Keyword, or Question rows.

It creates:

- admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- Category `guides`
- SeedTopic `윈도우`
- Keyword `윈도우`
- published Question `windows-practical-guide`
- Answer and SeoMetadata for the question

### 6. Development Server

```bash
npm run dev
```

### 7. DB CRUD Check

- Open `http://localhost:3000/admin`.
- Confirm the Seed topics, Keywords, and Questions tables show seeded PostgreSQL data.
- Use the SeedTopic form to add a new keyword.
- Confirm the new row appears in the Seed topics table after submit.
- Open `http://localhost:3000/q/windows-practical-guide` to verify seeded published content.

## DB Health Check

CLI:

```bash
npm run db:check
```

HTTP:

```text
GET /api/health/db
```

Production URLs after domain deployment:

```text
https://infofixhub.org
https://infofixhub.org/sitemap.xml
https://infofixhub.org/robots.txt
https://www.infofixhub.org
```

Submit `https://infofixhub.org/sitemap.xml` in Google Search Console after deployment.

The health endpoint returns connection status and row counts only. It does not return `DATABASE_URL` or credentials.

## Prisma Scripts

- `npm run db:generate`: generate Prisma client
- `npm run db:migrate`: run `prisma migrate dev` for local development
- `npm run db:deploy`: run `prisma migrate deploy` for production
- `npm run db:seed`: run idempotent seed
- `npm run db:studio`: open Prisma Studio
- `npm run db:check`: run safe PostgreSQL connectivity check

## Main Tables

`User`, `Category`, `SeedTopic`, `Keyword`, `KeywordSource`, `KeywordMetricSnapshot`, `KeywordCluster`, `KeywordClusterMember`, `Question`, `Answer`, `SeoMetadata`, `ContentSource`, `GenerationJob`, `Advertiser`, `Product`, `Campaign`, `CampaignTarget`, `AdCreative`, `AdImpression`, `AdClick`, `SearchPerformanceDaily`, `PageAnalytics`, `GrowthRecommendation`, `ProviderStatus`, `ApiUsageLog`, `AuditLog`

## Important Constraints

- `Keyword` uses `@@unique([normalizedKeyword, country, language])`.
- `Question.slug` is unique.
- `SearchPerformanceDaily` uses `@@unique([query, page, date, country, device])`; `country` and `device` default to `ALL` so PostgreSQL can enforce duplicate import prevention.
- Ad impressions and clicks have indexes for question, campaign, creative, and date-based reporting.
- Page analytics are unique per question and date.
- SeedTopic is unique per category, keyword, country, and language.

## Validation

Run before handoff:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## OpenAI Variables For Next Phase

AI content generation requires:

```env
AI_PROVIDER=
OPENAI_API_KEY=
OPENAI_MODEL=
```
