UPDATE "Question"
SET "status" = 'ARCHIVED',
    "publishedAt" = NULL,
    "updatedAt" = NOW()
WHERE "slug" IN (
  'slow-computer-fix-checklist',
  'windows-boot-error-checklist',
  'windows-practical-guide',
  '윈도우-msu35xqx'
);
