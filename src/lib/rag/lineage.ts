// Evidence Lineage Graph Engine — End-to-end trace mapping

import {
  LineageGraph,
  LineageNode,
  LineageEdge,
  Claim,
  DocumentChunk,
  AbstentionType,
} from "./types";

export interface LineageBuildParams {
  questionId: string;
  questionText: string;
  answerId: string;
  answerText: string;
  abstentionType: AbstentionType;
  retrievedChunks: DocumentChunk[];
  claims: Claim[];
}

export function buildEvidenceLineage(params: LineageBuildParams): LineageGraph {
  const nodes: LineageNode[] = [];
  const edges: LineageEdge[] = [];

  // 1. Root Question Node
  const questionNodeId = `node-q-${params.questionId}`;
  nodes.push({
    id: questionNodeId,
    type: "question",
    label: "User Inquiry",
    title: params.questionText,
    details: `Input query submitted for grounded verification`,
  });

  // 2. Answer Node
  const answerNodeId = `node-ans-${params.answerId}`;
  nodes.push({
    id: answerNodeId,
    type: "answer",
    label: "Generated Synthesis",
    title: params.answerText.slice(0, 120) + (params.answerText.length > 120 ? "..." : ""),
    status: params.abstentionType,
    details: `Abstention State: ${params.abstentionType.toUpperCase()}`,
  });

  edges.push({
    id: `edge-q-to-ans`,
    source: questionNodeId,
    target: answerNodeId,
    label: "synthesized from",
  });

  // 3. Retrieved Chunk Nodes
  for (const chunk of params.retrievedChunks) {
    const chunkNodeId = `node-chunk-${chunk.id}`;
    const docTitle = chunk.metadata?.documentTitle || "Document";
    nodes.push({
      id: chunkNodeId,
      type: "chunk",
      label: `Passage (p. ${chunk.pageNumber})`,
      title: `${docTitle} — Chunk #${chunk.chunkIndex + 1}`,
      details: chunk.content.slice(0, 160) + (chunk.content.length > 160 ? "..." : ""),
      metadata: {
        documentId: chunk.documentId,
        pageNumber: chunk.pageNumber,
        tokenCount: chunk.tokenCount,
      },
    });

    // Edge from question to retrieved chunk
    edges.push({
      id: `edge-q-to-chunk-${chunk.id}`,
      source: questionNodeId,
      target: chunkNodeId,
      label: "retrieved",
    });
  }

  // 4. Claims, Citations, and Assessments
  for (const claim of params.claims) {
    const claimNodeId = `node-claim-${claim.id}`;
    nodes.push({
      id: claimNodeId,
      type: "claim",
      label: `Claim #${claim.claimOrder}`,
      title: claim.claimText,
      status: claim.status,
      details: `Status: ${claim.status.toUpperCase()} (${Math.round(claim.confidence * 100)}% confidence)`,
    });

    // Edge from Answer to Claim
    edges.push({
      id: `edge-ans-to-claim-${claim.id}`,
      source: answerNodeId,
      target: claimNodeId,
      label: "asserts",
    });

    // Citations & Passages
    for (const citation of claim.citations) {
      const citNodeId = `node-cit-${citation.id}`;
      nodes.push({
        id: citNodeId,
        type: "citation",
        label: citation.isValidated ? "Verified Citation" : "Unverified Citation",
        title: `"${citation.exactQuote.slice(0, 90)}${citation.exactQuote.length > 90 ? "..." : ""}"`,
        status: citation.isValidated ? "supported" : "unresolved",
        details: citation.documentTitle
          ? `Source: ${citation.documentTitle} (p. ${citation.pageNumber})`
          : "Source passage",
      });

      // Edge from Claim to Citation
      edges.push({
        id: `edge-claim-to-cit-${citation.id}`,
        source: claimNodeId,
        target: citNodeId,
        label: "cites",
      });

      // Edge from Citation to Chunk (if chunk is in retrieved set)
      if (citation.chunkId) {
        const targetChunkNodeId = `node-chunk-${citation.chunkId}`;
        edges.push({
          id: `edge-cit-to-chunk-${citation.id}`,
          source: citNodeId,
          target: targetChunkNodeId,
          label: citation.isValidated ? "exact passage match" : "potential mismatch",
        });
      }
    }

    // Evidence Assessment Node
    if (claim.assessment) {
      const assessNodeId = `node-assess-${claim.assessment.id}`;
      nodes.push({
        id: assessNodeId,
        type: "assessment",
        label: `${claim.assessment.evaluatorType === "human" ? "Human Review" : "Evidence Assessment"}`,
        title: claim.assessment.rationale,
        status: claim.assessment.assessmentStatus,
        details: `Verdict: ${claim.assessment.assessmentStatus.toUpperCase()}`,
      });

      edges.push({
        id: `edge-claim-to-assess-${claim.id}`,
        source: claimNodeId,
        target: assessNodeId,
        label: "evaluated as",
      });
    }
  }

  return { nodes, edges };
}
