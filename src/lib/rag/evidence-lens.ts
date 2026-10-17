// Evidence Lens — Claim-Level Evidence Inspection Engine

import { Claim, ClaimStatus, Citation, DocumentChunk } from "./types";
import { validateCitationQuote } from "./citation-validator";

export interface EvidenceLensEvaluation {
  claims: Claim[];
  supportedCount: number;
  unresolvedCount: number;
  contradictedCount: number;
  citationMismatchCount: number;
  overallSupportRate: number;
}

export function evaluateEvidenceLens(
  rawClaims: Array<{
    claimText: string;
    status?: ClaimStatus;
    confidence?: number;
    citations?: Array<{
      chunkId?: string;
      exactQuote: string;
      pageNumber?: number;
      relevanceScore?: number;
    }>;
  }>,
  chunksMap: Map<string, DocumentChunk>
): EvidenceLensEvaluation {
  const claims: Claim[] = [];
  let supportedCount = 0;
  let unresolvedCount = 0;
  let contradictedCount = 0;
  let citationMismatchCount = 0;

  rawClaims.forEach((raw, idx) => {
    const claimId = `claim-${idx + 1}`;
    const validatedCitations: Citation[] = [];

    const rawCitations = raw.citations || [];
    let hasValidCitation = false;
    let hasMismatch = false;

    for (let cIdx = 0; cIdx < rawCitations.length; cIdx++) {
      const c = rawCitations[cIdx];
      const chunk = c.chunkId ? chunksMap.get(c.chunkId) : undefined;
      const citationId = `cit-${claimId}-${cIdx + 1}`;

      const validation = validateCitationQuote(
        {
          id: citationId,
          claimId,
          chunkId: c.chunkId,
          exactQuote: c.exactQuote,
          pageNumber: c.pageNumber || chunk?.pageNumber,
          relevanceScore: c.relevanceScore || 0.8,
          isValidated: false,
        },
        chunk
      );

      if (validation.isValid) {
        hasValidCitation = true;
      } else {
        hasMismatch = true;
        citationMismatchCount++;
      }

      validatedCitations.push({
        id: citationId,
        claimId,
        chunkId: c.chunkId,
        documentId: chunk?.documentId,
        versionId: chunk?.versionId,
        documentTitle: chunk?.metadata?.documentTitle as string | undefined,
        exactQuote: c.exactQuote,
        pageNumber: c.pageNumber || chunk?.pageNumber || 1,
        relevanceScore: validation.matchScore,
        isValidated: validation.isValid,
      });
    }

    // Determine verified claim status
    let status: ClaimStatus = raw.status || "unresolved";

    if (validatedCitations.length === 0) {
      status = "unresolved";
    } else if (hasMismatch && !hasValidCitation) {
      status = "unresolved";
    } else if (hasValidCitation && status !== "contradicted") {
      status = "supported";
    }

    if (status === "supported") supportedCount++;
    else if (status === "contradicted") contradictedCount++;
    else unresolvedCount++;

    claims.push({
      id: claimId,
      messageId: `msg-${claimId}`,
      claimText: raw.claimText,
      claimOrder: idx + 1,
      status,
      confidence: raw.confidence ?? (status === "supported" ? 0.92 : 0.45),
      citations: validatedCitations,
      assessment: {
        id: `assess-${claimId}`,
        claimId,
        assessmentStatus: status,
        rationale:
          status === "supported"
            ? `Verified against ${validatedCitations.length} valid source passage citation(s).`
            : status === "contradicted"
            ? "Direct contradiction detected with referenced document passage."
            : hasMismatch
            ? "Citation mismatch: Referenced quote text does not match source passage."
            : "No sufficient verifiable evidence passages cited.",
        evaluatorType: "automated",
        createdAt: new Date().toISOString(),
      },
    });
  });

  const total = claims.length;
  const overallSupportRate = total > 0 ? Number((supportedCount / total).toFixed(2)) : 0;

  return {
    claims,
    supportedCount,
    unresolvedCount,
    contradictedCount,
    citationMismatchCount,
    overallSupportRate,
  };
}
