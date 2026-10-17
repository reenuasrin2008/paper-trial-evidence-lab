// Prompt-injection defense and untrusted content sanitizer

export interface SanitizedContent {
  cleanedText: string;
  hasSuspiciousDirectives: boolean;
  neutralizedPatterns: string[];
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
  /you\s+are\s+now\s+(in\s+)?developer\s+mode/gi,
  /system\s+override/gi,
  /disregard\s+(all\s+)?(safety|system)\s+rules/gi,
  /reveal\s+(the\s+)?(system\s+prompt|hidden\s+key|api\s+key)/gi,
  /bypass\s+(all\s+)?content\s+filters/gi,
];

export function sanitizeDocumentContent(rawText: string): SanitizedContent {
  let cleanedText = rawText;
  const neutralizedPatterns: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleanedText)) {
      neutralizedPatterns.push(pattern.source);
      cleanedText = cleanedText.replace(pattern, "[UNTRUSTED INSTRUCTION NEUTRALIZED]");
    }
  }

  return {
    cleanedText: cleanedText.trim(),
    hasSuspiciousDirectives: neutralizedPatterns.length > 0,
    neutralizedPatterns,
  };
}

export function sanitizeUserQuery(query: string): string {
  // Strip control characters while preserving valid Unicode punctuation
  return query.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}
