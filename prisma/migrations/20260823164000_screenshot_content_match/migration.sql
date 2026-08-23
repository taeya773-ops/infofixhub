ALTER TABLE "ContentScreenshot"
ADD COLUMN "matchScore" DOUBLE PRECISION,
ADD COLUMN "matchesContent" BOOLEAN,
ADD COLUMN "detectedScreen" TEXT,
ADD COLUMN "matchNotes" TEXT,
ADD COLUMN "recommendedAction" TEXT,
ADD COLUMN "analyzedAt" TIMESTAMP(3);
