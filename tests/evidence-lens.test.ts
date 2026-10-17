import { describe, it, expect } from "vitest";
import { evaluateEvidenceLens } from "../src/lib/rag/evidence-lens";
import { DocumentChunk } from "../src/lib/rag/types";

describe("Evidence Lens Claim Verification", () => {
  const chunk: DocumentChunk = {
    id: "chunk-100",
    documentId: "doc-clinical",
    versionId: "ver-1",
    workspaceId: "ws-1",
    chunkIndex: 0,
    pageNumber: 1,
    content: "Evaluate efficacy and safety in 450 adult patients across 12 clinical centers.",
    tokenCount: 16,
    metadata: { documentTitle: "Clinical Trial Protocol" },
  };

  const chunkMap = new Map<string, DocumentChunk>([[chunk.id, chunk]]);

  it("classifies claims with verbatim quotes as supported", () => {
    const rawClaims = [
      {
        claimText: "The study enrolled 450 adult patients across 12 centers.",
        status: "supported" as const,
        confidence: 0.95,
        citations: [
          {
            chunkId: "chunk-100",
            exactQuote: "450 adult patients across 12 clinical centers",
            pageNumber: 1,
          },
        ],
      },
    ];

    const result = evaluateEvidenceLens(rawClaims, chunkMap);
    expect(result.claims.length).toBe(1);
    expect(result.claims[0].status).toBe("supported");
    expect(result.supportedCount).toBe(1);
    expect(result.citationMismatchCount).toBe(0);
    expect(result.overallSupportRate).toBe(1.0);
  });

  it("marks claims with false or missing citations as unresolved", () => {
    const rawClaims = [
      {
        claimText: "The study achieved 99% remission in infants.",
        citations: [
          {
            chunkId: "chunk-100",
            exactQuote: "99% remission in infants",
            pageNumber: 1,
          },
        ],
      },
    ];

    const result = evaluateEvidenceLens(rawClaims, chunkMap);
    expect(result.claims[0].status).toBe("unresolved");
    expect(result.citationMismatchCount).toBe(1);
    expect(result.overallSupportRate).toBe(0.0);
  });
});
