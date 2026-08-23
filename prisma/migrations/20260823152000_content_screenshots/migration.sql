CREATE TABLE "ContentScreenshot" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "insertAfter" TEXT NOT NULL,
    "captureType" TEXT NOT NULL,
    "requiredScreen" TEXT NOT NULL,
    "targetUrl" TEXT,
    "targetSelector" TEXT,
    "highlightDescription" TEXT,
    "caption" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "sourceType" TEXT,
    "mimeType" TEXT,
    "fileName" TEXT,
    "imageData" BYTEA,
    "imageSize" INTEGER,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentScreenshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentScreenshot_questionId_stepNumber_idx" ON "ContentScreenshot"("questionId", "stepNumber");
CREATE INDEX "ContentScreenshot_status_updatedAt_idx" ON "ContentScreenshot"("status", "updatedAt");

ALTER TABLE "ContentScreenshot" ADD CONSTRAINT "ContentScreenshot_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
