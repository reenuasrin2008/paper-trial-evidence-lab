import { NextRequest, NextResponse } from "next/server";
import { globalVectorStore } from "@/lib/rag/vector-store";
import { generateGroundedAnswer } from "@/lib/gemini/client";
import { evaluateEvidenceLens } from "@/lib/rag/evidence-lens";
import { buildEvidenceLineage } from "@/lib/rag/lineage";
import { synthesizeVisualExplanation, detectPreferredVisualType } from "@/lib/analysis/visual-synthesizer";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";
import { globalBusinessService } from "@/lib/business/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      workspaceId = "demo-workspace",
      documentIds,
      topK = 5,
      similarityThreshold = 0.3,
      modelName = "gemini-3.8-flash",
      includeVisual = false,
    } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing required 'question' parameter" }, { status: 400 });
    }

    // Ensure demo documents are populated
    await initializeDemoWorkspace(workspaceId);

    // 1. Vector Search
    const retrievalResults = await globalVectorStore.search(question, {
      workspaceId,
      documentIds,
      topK,
      similarityThreshold,
    });

    const retrievedChunks = retrievalResults.map((r) => r.chunk);

    // 2. Synthesize Grounded Answer with strict citation rules
    const contextFormatted = retrievedChunks.map((c) => ({
      id: c.id,
      documentTitle: (c.metadata?.documentTitle as string) || "Document",
      pageNumber: c.pageNumber,
      content: c.content,
    }));

    const synthesis = await generateGroundedAnswer(question, contextFormatted, modelName);

    // 3. Evidence Lens Verification
    const chunkMap = new Map(retrievedChunks.map((c) => [c.id, c]));
    const lensEval = evaluateEvidenceLens(synthesis.claims, chunkMap);

    // 4. Build Evidence Lineage Graph
    const inquiryId = `inq-${Date.now()}`;
    const lineage = buildEvidenceLineage({
      questionId: inquiryId,
      questionText: question,
      answerId: `ans-${inquiryId}`,
      answerText: synthesis.answer,
      abstentionType: synthesis.abstentionType,
      retrievedChunks,
      claims: lensEval.claims,
    });

    // 5. Audit Logging (privacy-safe metadata only)
    globalBusinessService.recordEvent({
      workspaceId,
      action: "rag_inquiry_executed",
      targetType: "inquiry",
      metadata: {
        retrievedCount: retrievedChunks.length,
        abstentionType: synthesis.abstentionType,
        claimsCount: lensEval.claims.length,
        supportRate: lensEval.overallSupportRate,
        modelName,
      },
    });

    // 6. Universal Visual Explanation (synthesized when requested or query indicates visual intent)
    const isVisualQuery =
      includeVisual ||
      /flowchart|diagram|architecture|sequence|timeline|concept map|compare|comparison|chart|graph|workflow|step by step|decision tree/i.test(
        question
      );

    let visual = null;
    if (isVisualQuery && retrievedChunks.length > 0) {
      visual = await synthesizeVisualExplanation(
        question,
        synthesis.answer,
        contextFormatted,
        modelName
      );
    }

    return NextResponse.json({
      inquiryId,
      question,
      answer: synthesis.answer,
      abstentionType: synthesis.abstentionType,
      abstentionReason: synthesis.abstentionReason,
      claims: lensEval.claims,
      retrievedChunks,
      lineage,
      visual,
      metrics: {
        retrievedCount: retrievedChunks.length,
        supportedCount: lensEval.supportedCount,
        contradictedCount: lensEval.contradictedCount,
        unresolvedCount: lensEval.unresolvedCount,
        citationMismatchCount: lensEval.citationMismatchCount,
        overallSupportRate: lensEval.overallSupportRate,
      },
    });
  } catch (error) {
    console.error("API /rag/generate error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
