import { describe, it, expect } from "vitest";
import { validateCitationQuote } from "../src/lib/rag/citation-validator";
import { DocumentChunk, Citation } from "../src/lib/rag/types";

describe("Citation Verbatim & Mismatch Validator", () => {
  const sampleChunk: DocumentChunk = {
    id: "chunk-1",
    documentId: "doc-1",
    versionId: "ver-1",
    workspaceId: "ws-1",
    chunkIndex: 0,
    pageNumber: 2,
    content: "The treatment cohort demonstrated an overall response rate of 74.2% compared to 31.8% in the placebo group.",
    tokenCount: 22,
  };

  it("validates exact verbatim substring matches with 1.0 score", () => {
    const citation: Citation = {
      id: "cit-1",
      claimId: "cl-1",
      chunkId: "chunk-1",
      exactQuote: "response rate of 74.2% compared to 31.8%",
      relevanceScore: 0.9,
      isValidated: false,
    };

    const res = validateCitationQuote(citation, sampleChunk);
    expect(res.isValid).toBe(true);
    expect(res.isVerbatim).toBe(true);
    expect(res.matchScore).toBe(1.0);
  });

  it("flags citation mismatches when quote does not appear in source passage", () => {
    const citation: Citation = {
      id: "cit-2",
      claimId: "cl-2",
      chunkId: "chunk-1",
      exactQuote: "achieved an unprecedented 99.9% cure rate",
      relevanceScore: 0.9,
      isValidated: false,
    };

    const res = validateCitationQuote(citation, sampleChunk);
    expect(res.isValid).toBe(false);
    expect(res.isVerbatim).toBe(false);
    expect(res.reason).toContain("Citation mismatch");
  });

  it("fails validation when referenced chunk does not exist", () => {
    const citation: Citation = {
      id: "cit-3",
      claimId: "cl-3",
      chunkId: "missing-chunk",
      exactQuote: "any quote",
      relevanceScore: 0.5,
      isValidated: false,
    };

    const res = validateCitationQuote(citation, undefined);
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain("does not exist");
  });
});
