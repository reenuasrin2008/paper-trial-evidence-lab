// Developer Regression Lab — Metric Calculations and Experiment Runner

import {
  EvalTestCase,
  ExperimentRun,
  RunCaseResult,
  Citation,
} from "../rag/types";
import { globalVectorStore } from "../rag/vector-store";
import { generateGroundedAnswer } from "../gemini/client";
import { evaluateEvidenceLens } from "../rag/evidence-lens";

export interface MetricDefinition {
  name: string;
  formula: string;
  assumptions: string;
  limitations: string;
}

export const EVAL_METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  retrievalPrecision: {
    name: "Retrieval Precision",
    formula: "Relevant Retrieved Chunks / Total Retrieved Chunks",
    assumptions: "Ground-truth relevant chunk IDs or expected key terms are present in the test case.",
    limitations: "Sensitive to vocabulary overlap and chunk boundary splits.",
  },
  retrievalRecall: {
    name: "Retrieval Recall",
    formula: "Relevant Retrieved Chunks / Total Expected Relevant Chunks",
    assumptions: "Test case specifies all passages required to answer the query.",
    limitations: "Does not penalize redundant retrieved passages.",
  },
  citationCorrectness: {
    name: "Citation Verbatim Correctness",
    formula: "Verifiable Substring Citations / Total Citations Asserted",
    assumptions: "Model must cite exact source text without hallucinating quotes.",
    limitations: "Does not score grammatical paraphrasing as 1.0.",
  },
  evidenceSupportRate: {
    name: "Evidence Support Rate",
    formula: "Supported Claims / Total Asserted Claims",
    assumptions: "Decomposed atomic claims must be backed by at least one valid citation.",
    limitations: "Automated claim extraction may under-segment complex compound sentences.",
  },
  abstentionAccuracy: {
    name: "Abstention Decision Accuracy",
    formula: "Correct Abstention Outcomes / Total Unanswerable or Conflicting Cases",
    assumptions: "Unanswerable questions must trigger explicit abstention instead of hallucinating an answer.",
    limitations: "Requires high-quality adversarial gold labels.",
  },
};

export class EvalEngine {
  private runs: Map<string, ExperimentRun> = new Map();

  async executeExperimentRun(
    workspaceId: string,
    runName: string,
    testCases: EvalTestCase[],
    retrievalConfig: {
      chunkSize: number;
      chunkOverlap: number;
      topK: number;
      similarityThreshold: number;
    },
    modelName = "gemini-1.5-flash"
  ): Promise<ExperimentRun> {
    const runId = `run-${Date.now()}`;
    const startTime = Date.now();
    const caseResults: RunCaseResult[] = [];

    let totalPrecision = 0;
    let totalRecall = 0;
    let totalCitationCorrectness = 0;
    let totalSupportRate = 0;
    let correctAbstentions = 0;
    let totalLatency = 0;

    for (const testCase of testCases) {
      const caseStartTime = Date.now();

      // 1. Vector Retrieval
      const retrievalResults = await globalVectorStore.search(testCase.question, {
        workspaceId,
        topK: retrievalConfig.topK,
        similarityThreshold: retrievalConfig.similarityThreshold,
      });

      const retrievedChunks = retrievalResults.map((r) => r.chunk);
      const retrievedIds = retrievedChunks.map((c) => c.id);

      // 2. Measure retrieval metrics
      let casePrecision = 0;
      let caseRecall = 0;
      if (testCase.expectedEvidence && retrievedChunks.length > 0) {
        const expectedLower = testCase.expectedEvidence.toLowerCase();
        const matches = retrievedChunks.filter((c) =>
          c.content.toLowerCase().includes(expectedLower)
        ).length;
        casePrecision = matches / retrievedChunks.length;
        caseRecall = matches > 0 ? 1.0 : 0.0;
      } else if (testCase.expectedAbstention) {
        casePrecision = retrievedChunks.length === 0 ? 1.0 : 0.5;
        caseRecall = 1.0;
      }

      // 3. Grounded Answer Synthesis
      const contextFormatted = retrievedChunks.map((c) => ({
        id: c.id,
        documentTitle: (c.metadata?.documentTitle as string) || "Document",
        pageNumber: c.pageNumber,
        content: c.content,
      }));

      const synthesis = await generateGroundedAnswer(
        testCase.question,
        contextFormatted,
        modelName
      );

      // 4. Evidence Lens Validation
      const chunkMap = new Map(retrievedChunks.map((c) => [c.id, c]));
      const lensEval = evaluateEvidenceLens(synthesis.claims, chunkMap);

      const didAbstain = synthesis.abstentionType !== "none";
      const abstentionCorrect = didAbstain === testCase.expectedAbstention;
      if (abstentionCorrect) correctAbstentions++;

      const citationCorrect =
        lensEval.claims.length > 0
          ? (lensEval.claims.length - lensEval.citationMismatchCount) /
            lensEval.claims.length
          : didAbstain
          ? 1.0
          : 0.0;

      const caseLatency = Date.now() - caseStartTime;
      totalLatency += caseLatency;
      totalPrecision += casePrecision;
      totalRecall += caseRecall;
      totalCitationCorrectness += citationCorrect;
      totalSupportRate += lensEval.overallSupportRate;

      let judgeVerdict: RunCaseResult["judgeVerdict"] = "passed";
      if (!abstentionCorrect) judgeVerdict = "abstention_error";
      else if (lensEval.citationMismatchCount > 0) judgeVerdict = "citation_mismatch";
      else if (lensEval.overallSupportRate < 0.6 && !didAbstain) judgeVerdict = "failed";

      const flatCitations: Citation[] = lensEval.claims.flatMap((cl) => cl.citations);

      caseResults.push({
        id: `case-res-${testCase.id}-${Date.now()}`,
        runId,
        testCaseId: testCase.id,
        question: testCase.question,
        actualOutput: synthesis.answer,
        retrievedChunkIds: retrievedIds,
        actualCitations: flatCitations,
        didAbstain,
        abstentionCorrect,
        retrievalPrecision: Number(casePrecision.toFixed(2)),
        retrievalRecall: Number(caseRecall.toFixed(2)),
        citationCorrectness: Number(citationCorrect.toFixed(2)),
        evidenceSupportRate: Number(lensEval.overallSupportRate.toFixed(2)),
        latencyMs: caseLatency,
        tokenCount: Math.ceil(synthesis.answer.length / 4) + 150,
        judgeVerdict,
      });
    }

    const n = Math.max(testCases.length, 1);
    const run: ExperimentRun = {
      id: runId,
      workspaceId,
      name: runName,
      retrievalConfig,
      modelName,
      embeddingModel: "text-embedding-004",
      status: "completed",
      metricsSummary: {
        totalCases: testCases.length,
        accuracy: Number((correctAbstentions / n).toFixed(2)),
        precision: Number((totalPrecision / n).toFixed(2)),
        recall: Number((totalRecall / n).toFixed(2)),
        citationCorrectness: Number((totalCitationCorrectness / n).toFixed(2)),
        supportRate: Number((totalSupportRate / n).toFixed(2)),
        abstentionF1: Number((correctAbstentions / n).toFixed(2)),
        avgLatencyMs: Math.round(totalLatency / n),
      },
      results: caseResults,
      createdAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.runs.set(runId, run);
    return run;
  }

  getRun(runId: string): ExperimentRun | undefined {
    return this.runs.get(runId);
  }

  getAllRuns(workspaceId: string): ExperimentRun[] {
    return Array.from(this.runs.values()).filter(
      (r) => r.workspaceId === workspaceId
    );
  }
}

export const globalEvalEngine = new EvalEngine();
