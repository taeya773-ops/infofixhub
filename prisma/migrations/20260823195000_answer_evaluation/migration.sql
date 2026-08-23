ALTER TABLE "Answer"
ADD COLUMN "evaluationStatus" TEXT,
ADD COLUMN "evaluationScore" DOUBLE PRECISION,
ADD COLUMN "evaluationNotes" TEXT,
ADD COLUMN "evaluatorProvider" TEXT,
ADD COLUMN "evaluatorModel" TEXT,
ADD COLUMN "revisionCount" INTEGER NOT NULL DEFAULT 0;
