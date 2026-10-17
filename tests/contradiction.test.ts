import { describe, it, expect } from "vitest";
import {
  detectContradictionsBetweenChunks,
  ContradictionService,
} from "../src/lib/analysis/contradiction";
import { DocumentChunk } from "../src/lib/rag/types";

describe("Contradiction Analysis & Review Engine", () => {
  const chunkA: DocumentChunk = {
    id: "chunk-docA",
    documentId: "doc-A",
    versionId: "ver-1",
    workspaceId: "ws-1",
    chunkIndex: 0,
    pageNumber: 1,
    content: "Remote tele-health visits are prohibited for vital assessments.",
    tokenCount: 10,
    metadata: { documentTitle: "Protocol v1" },
  };

  const chunkB: DocumentChunk = {
    id: "chunk-docB",
    documentId: "doc-B",
    versionId: "ver-2",
    workspaceId: "ws-1",
    chunkIndex: 0,
    pageNumber: 1,
    content: "Remote tele-health visits are now permitted for routine monitoring.",
    tokenCount: 10,
    metadata: { documentTitle: "Protocol Amendment v2" },
  };

  it("identifies polar contradictions between distinct documents", () => {
    const candidate = detectContradictionsBetweenChunks(chunkA, chunkB);
    expect(candidate).not.toBeNull();
    expect(candidate?.status).toBe("unreviewed");
    expect(candidate?.disagreementExplanation).toContain("authorization or compliance");
  });

  it("records human review state transitions and notes", () => {
    const service = new ContradictionService();
    const candidate = detectContradictionsBetweenChunks(chunkA, chunkB)!;
    service.addCandidate(candidate);

    const updated = service.updateReviewStatus(
      candidate.id,
      "rejected_compatible",
      "Lead Compliance Officer",
      "v2 explicitly supersedes v1 guidelines."
    );

    expect(updated?.status).toBe("rejected_compatible");
    expect(updated?.reviewedBy).toBe("Lead Compliance Officer");
    expect(updated?.reviewerNotes).toContain("supersedes v1");
  });
});
