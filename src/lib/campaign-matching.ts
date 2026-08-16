export type CampaignMatchContext = {
  questionTitle: string;
  primaryKeyword: string;
  categoryId: string | null;
  searchIntent: string;
  country: string;
  language: string;
  answerText?: string | null;
};

export type CampaignTargetInput = {
  keyword: string | null;
  intent: string | null;
  categoryId: string | null;
  country: string | null;
  language: string | null;
  weight: number;
};

export type CampaignMatchResult = {
  score: number;
  matchedKeywords: string[];
  reasons: string[];
};

const MATCH_THRESHOLD = 60;

export function ctaMatchThreshold() {
  return MATCH_THRESHOLD;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordTerms(keyword: string | null) {
  return (keyword ?? "")
    .split(/[,\n]/)
    .map((term) => normalizeText(term))
    .filter((term) => term.length >= 2);
}

function includesTerm(haystack: string, term: string) {
  if (!term) return false;
  return haystack.includes(term);
}

export function scoreCampaignTarget(
  target: CampaignTargetInput,
  context: CampaignMatchContext,
): CampaignMatchResult {
  const title = normalizeText(context.questionTitle);
  const primaryKeyword = normalizeText(context.primaryKeyword);
  const answerText = normalizeText(context.answerText ?? "");
  const combined = `${title} ${primaryKeyword} ${answerText}`.trim();
  const terms = keywordTerms(target.keyword);
  const matchedKeywords = terms.filter((term) => includesTerm(combined, term));
  const titleMatch = terms.some((term) => includesTerm(title, term));
  const primaryKeywordMatch = terms.some((term) => includesTerm(primaryKeyword, term));
  const answerMatch = terms.some((term) => includesTerm(answerText, term));
  const categoryMatch = Boolean(
    target.categoryId && context.categoryId && target.categoryId === context.categoryId,
  );
  const intentMatch = Boolean(
    target.intent &&
      normalizeText(target.intent) === normalizeText(context.searchIntent),
  );
  const localeMatch =
    (!target.country || target.country === context.country) &&
    (!target.language || target.language === context.language);

  let score = 0;
  const reasons: string[] = [];

  if (titleMatch) {
    score += 40;
    reasons.push("question-title");
  }
  if (primaryKeywordMatch) {
    score += 30;
    reasons.push("primary-keyword");
  }
  if (answerMatch) {
    score += 15;
    reasons.push("answer-context");
  }
  if (categoryMatch) {
    score += 20;
    reasons.push("category");
  }
  if (intentMatch) {
    score += 10;
    reasons.push("intent");
  }
  if (localeMatch) {
    score += 10;
    reasons.push("locale");
  }

  score = Math.round(Math.min(100, score * Math.max(0.1, target.weight || 1)));

  return { score, matchedKeywords, reasons };
}

export function shouldShowCta(result: CampaignMatchResult) {
  return result.score >= MATCH_THRESHOLD && result.matchedKeywords.length > 0;
}
