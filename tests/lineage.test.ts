import { describe, it, expect } from "vitest";
import { buildEvidenceLineage } from "../src/lib/rag/lineage";
import { Claim, DocumentChunk } from "../src/lib/rag/types";

describe("Evidence Lineage Graph Construction", () => {
  it("generates directed graph connecting question, chunks, answer, claims, and citations", () => {
    const chunk: DocumentChunk = {
      id: "c-1",
      documentId: "doc-1",
      versionId: "ver-1",
      workspaceId: "ws-1",
      chunkIndex: 0,
      pageNumber: 1,
      content: "Dosage mandate: Initial dosing is established at 25mg administered twice daily.",
      tokenCount: 15,
      metadata: { documentTitle: "Protocol v1" },
    };

    const claim: Claim = {
      id: "claim-1",
      messageId: "msg-1",
      claimText: "Initial dosing is 25mg twice daily.",
      claimOrder: 1,
      status: "supported",
      confidence: 0.95,
      citations: [
        {
          id: "cit-1",
          claimId: "claim-1",
          chunkId: "c-1",
          exactQuote: "25mg administered twice daily",
          pageNumber: 1,
          relevanceScore: 1.0,
          isValidated: true,
        },
      ],
      assessment: {
        id: "assess-1",
        claimId: "claim-1",
        assessmentStatus: "supported",
        rationale: "Exact passage match verified.",
        evaluatorType: "automated",
        createdAt: new Date().toISOString(),
      },
    };

    const lineage = buildEvidenceLineage({
      questionId: "q-101",
      questionText: "What is the initial dosing?",
      answerId: "ans-101",
      answerText: "The initial dosing is established at 25mg twice daily.",
      abstentionType: "none",
      retrievedChunks: [chunk],
      claims: [claim],
    });

    expect(lineage.nodes.some((n) => n.type === "question")).toBe(true);
    expect(lineage.nodes.some((n) => n.type === "chunk")).toBe(true);
    expect(lineage.nodes.some((n) => n.type === "claim")).toBe(true);
    expect(lineage.nodes.some((n) => n.type === "citation")).toBe(true);
    expect(lineage.nodes.some((n) => n.type === "assessment")).toBe(true);

    // Verify edges connect question to chunk and answer to claim
    expect(lineage.edges.some((e) => e.source.includes("q-101") && e.target.includes("c-1"))).toBe(true);
    expect(lineage.edges.some((e) => e.source.includes("claim-1") && e.target.includes("cit-1"))).toBe(true);
  });
});
