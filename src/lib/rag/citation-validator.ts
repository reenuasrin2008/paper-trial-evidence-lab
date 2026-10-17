// Citation Validation & Source Passage Verification

import { Citation, DocumentChunk } from "./types";

export interface CitationValidationResult {
  isValid: boolean;
  matchScore: number;
  isVerbatim: boolean;
  reason?: string;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateCitationQuote(
  citation: Citation,
  chunk?: DocumentChunk
): CitationValidationResult {
  if (!chunk) {
    return {
      isValid: false,
      matchScore: 0,
      isVerbatim: false,
      reason: "Referenced source chunk does not exist or is inaccessible in workspace.",
    };
  }

  if (!citation.exactQuote || citation.exactQuote.trim().length === 0) {
    return {
      isValid: false,
      matchScore: 0,
      isVerbatim: false,
      reason: "Citation missing required exact quote text.",
    };
  }

  const rawChunkContent = chunk.content;
  const rawQuote = citation.exactQuote.trim();

  // 1. Verbatim Substring Check
  if (rawChunkContent.includes(rawQuote)) {
    return {
      isValid: true,
      matchScore: 1.0,
      isVerbatim: true,
    };
  }

  // 2. Normalized Substring Check (ignoring whitespace and punctuation differences)
  const normChunk = normalizeText(rawChunkContent);
  const normQuote = normalizeText(rawQuote);

  if (normChunk.includes(normQuote)) {
    return {
      isValid: true,
      matchScore: 0.95,
      isVerbatim: false,
      reason: "Matched with minor whitespace/punctuation normalization.",
    };
  }

  // 3. Jaccard Token Overlap Check for fuzzy match
  const quoteTokens = new Set(normQuote.split(" "));
  const chunkTokens = new Set(normChunk.split(" "));

  let intersectionCount = 0;
  for (const token of Array.from(quoteTokens)) {
    if (chunkTokens.has(token)) {
      intersectionCount++;
    }
  }

  const tokenOverlap = quoteTokens.size > 0 ? intersectionCount / quoteTokens.size : 0;

  if (tokenOverlap >= 0.8) {
    return {
      isValid: true,
      matchScore: Number(tokenOverlap.toFixed(2)),
      isVerbatim: false,
      reason: `Paraphrased citation (${Math.round(tokenOverlap * 100)}% token overlap). Exact verbatim match was not found.`,
    };
  }

  return {
    isValid: false,
    matchScore: Number(tokenOverlap.toFixed(2)),
    isVerbatim: false,
    reason: `Citation mismatch: Quoted text does not appear in the referenced chunk (only ${Math.round(tokenOverlap * 100)}% lexical overlap).`,
  };
}
