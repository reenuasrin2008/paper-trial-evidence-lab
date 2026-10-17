// Contradiction Analysis & Review Engine

import { ContradictionCandidate, DocumentChunk } from "../rag/types";

export interface ContradictionDetectorOptions {
  workspaceId: string;
}

export function detectContradictionsBetweenChunks(
  chunkA: DocumentChunk,
  chunkB: DocumentChunk
): ContradictionCandidate | null {
  // Only compare distinct chunks across documents or different versions
  if (chunkA.id === chunkB.id) return null;
  if (chunkA.documentId === chunkB.documentId && chunkA.versionId === chunkB.versionId) {
    return null;
  }

  const textA = chunkA.content.toLowerCase();
  const textB = chunkB.content.toLowerCase();

  // Heuristic patterns for potential substantive disagreements
  const polarPairs: Array<[RegExp, RegExp, string]> = [
    [/\b(increase|increased|surge|higher)\b/, /\b(decrease|decreased|drop|lower|reduction)\b/, "Conflicting direction of metric change"],
    [/\b(prohibited|forbidden|banned|not allowed)\b/, /\b(permitted|authorized|allowed|mandatory)\b/, "Conflicting authorization or compliance policy"],
    [/\b(effective\s+\d{4})\b/, /\b(effective\s+\d{4})\b/, "Conflicting effective dates or milestone timelines"],
    [/\b(passed|approved|complied)\b/, /\b(failed|rejected|violated)\b/, "Conflicting evaluation or audit outcome"],
    [/\b(\d+(\.\d+)?%)\b/, /\b(\d+(\.\d+)?%)\b/, "Discrepancy in reported percentage figures"],
  ];

  for (const [patternA, patternB, reason] of polarPairs) {
    if (patternA.test(textA) && patternB.test(textB)) {
      return {
        id: `contra-${chunkA.id}-${chunkB.id}`,
        workspaceId: chunkA.workspaceId,
        chunkAId: chunkA.id,
        chunkBId: chunkB.id,
        docAId: chunkA.documentId,
        docBId: chunkB.documentId,
        docATitle: (chunkA.metadata?.documentTitle as string) || "Document A",
        docBTitle: (chunkB.metadata?.documentTitle as string) || "Document B",
        passageA: chunkA.content,
        passageB: chunkB.content,
        pageA: chunkA.pageNumber,
        pageB: chunkB.pageNumber,
        disagreementExplanation: reason,
        status: "unreviewed",
        createdAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

export class ContradictionService {
  private candidates: Map<string, ContradictionCandidate> = new Map();

  addCandidate(candidate: ContradictionCandidate): void {
    this.candidates.set(candidate.id, candidate);
  }

  getCandidates(workspaceId: string): ContradictionCandidate[] {
    return Array.from(this.candidates.values()).filter(
      (c) => c.workspaceId === workspaceId
    );
  }

  updateReviewStatus(
    candidateId: string,
    status: "confirmed_contradiction" | "rejected_compatible" | "unresolved",
    reviewerName: string,
    notes?: string
  ): ContradictionCandidate | undefined {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return undefined;

    candidate.status = status;
    candidate.reviewedBy = reviewerName;
    candidate.reviewedAt = new Date().toISOString();
    candidate.reviewerNotes = notes;

    return candidate;
  }
}

export const globalContradictionService = new ContradictionService();
