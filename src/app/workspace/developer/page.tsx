"use client";

import React, { useState } from "react";
import {
  Terminal,
  Play,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  RefreshCw,
  GitCompare,
  Sliders,
  ShieldAlert,
  Search,
  Cpu,
  FileText,
  Upload,
  X,
  Filter,
} from "lucide-react";
import {
  ExperimentRun,
  RunCaseResult,
  Claim,
  DocumentChunk,
  LineageGraph,
  AbstentionType,
  VisualExplanation,
} from "@/lib/rag/types";
import { EVAL_METRIC_DEFINITIONS } from "@/lib/developer/eval-engine";
import { DEFAULT_STRESS_TEST_CASES } from "@/lib/developer/stress-suite";
import { VisualAnswerRenderer } from "@/components/visualization/VisualAnswerRenderer";
import { EvidenceLens } from "@/components/evidence/EvidenceLens";
import { EvidenceLineageView } from "@/components/lineage/EvidenceLineageView";
import { PaperUpload, UploadedPaper } from "@/components/ui/PaperUpload";

export default function DeveloperWorkspacePage() {
  const [activeTab, setActiveTab] = useState<"qa" | "regression" | "stress" | "metrics">("qa");

  // Technical Q&A State
  const [query, setQuery] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);
  const [includeVisual, setIncludeVisual] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(["doc-ai-governance"]);
  const [answerData, setAnswerData] = useState<{
    answer: string;
    abstentionType: AbstentionType;
    claims: Claim[];
    retrievedChunks: DocumentChunk[];
    lineage: LineageGraph;
    visual: VisualExplanation | null;
  } | null>(null);

  const [devDocs, setDevDocs] = useState<UploadedPaper[]>([
    {
      documentId: "doc-ai-governance",
      versionId: "ver-doc-ai-governance-1",
      workspaceId: "demo-workspace",
      title: "Neural Retrieval & RAG System Governance Framework",
      totalPages: 2,
      totalChunks: 2,
    },
    {
      documentId: "doc-security-audit",
      versionId: "ver-doc-security-audit-1",
      workspaceId: "demo-workspace",
      title: "Cloud Infrastructure Security & Privacy Audit Report",
      totalPages: 1,
      totalChunks: 1,
    },
  ]);

  // Regression Lab Config & State
  const [chunkSize, setChunkSize] = useState(450);
  const [topK, setTopK] = useState(5);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.4);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");

  const [runningRegression, setRunningRegression] = useState(false);
  const [currentRun, setCurrentRun] = useState<ExperimentRun | null>(null);
  const [comparisonRun, setComparisonRun] = useState<ExperimentRun | null>(null);

  // Adversarial Stress Suite State
  const [runningStress, setRunningStress] = useState(false);
  const [stressRun, setStressRun] = useState<ExperimentRun | null>(null);

  const workspaceId = "demo-workspace";

  const handleRunQA = async () => {
    if (!query.trim()) return;
    setLoadingQA(true);
    try {
      const res = await fetch("/api/rag/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          workspaceId,
          documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
          topK: 6,
          includeVisual,
        }),
      });
      const data = await res.json();
      setAnswerData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQA(false);
    }
  };

  const handleExecuteRegression = async () => {
    setRunningRegression(true);
    try {
      const res = await fetch("/api/developer/regression/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          runName: `Config (k=${topK}, sim=${similarityThreshold})`,
          retrievalConfig: {
            chunkSize,
            chunkOverlap: 50,
            topK,
            similarityThreshold,
          },
          modelName: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.run) {
        if (currentRun && !comparisonRun) {
          setComparisonRun(currentRun);
        }
        setCurrentRun(data.run);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningRegression(false);
    }
  };

  const handleRunStressSuite = async () => {
    setRunningStress(true);
    try {
      const res = await fetch("/api/developer/stress-test/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          modelName: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.run) setStressRun(data.run);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningStress(false);
    }
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#526A80] mb-1">
            <Terminal className="w-4 h-4 text-[#17283B]" />
            <span>Developer & Reliability Engineering</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#17283B]">
            Technical Systems, Architecture & RAG Reliability
          </h1>
          <p className="text-xs text-[#526A80] mt-1 max-w-2xl">
            Understand technical specifications and system architectures through visual flowcharts and sequence diagrams,
            while measuring retrieval precision, citation correctness, and injection defenses.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-[#E8EEF2] p-1 rounded-lg text-xs font-semibold flex-wrap">
          {[
            { key: "qa", label: "Architecture Q&A" },
            { key: "regression", label: "Regression Lab" },
            { key: "stress", label: "Adversarial Stress Suite" },
            { key: "metrics", label: "Metric Definitions" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                activeTab === key
                  ? "bg-[#17283B] text-[#FFFFFF] shadow-sm"
                  : "text-[#526A80] hover:text-[#17283B]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Architecture & Technical Q&A */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-[#17283B]">
                  Technical Document Inspection
                </h3>
                <p className="text-xs text-[#526A80] mt-0.5">
                  Select specs, API docs, or architecture papers to query and visualize.
                </p>
              </div>
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#17283B] hover:bg-[#223B56] text-white text-xs font-semibold rounded-md self-start sm:self-auto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Technical Doc</span>
              </button>
            </div>

            {showUpload && (
              <div className="pt-3 border-t border-[#E8EEF2]">
                <PaperUpload
                  workspaceId={workspaceId}
                  onUploadSuccess={(doc) => {
                    setDevDocs((prev) => [...prev, doc]);
                    setSelectedDocIds([doc.documentId]);
                    setShowUpload(false);
                  }}
                />
              </div>
            )}

            {/* Document Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8EEF2]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F]">
                Active Scope:
              </span>
              {devDocs.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.documentId);
                return (
                  <button
                    key={doc.documentId}
                    onClick={() => toggleDocSelection(doc.documentId)}
                    className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
                      isSelected
                        ? "bg-[#17283B] text-white border-[#17283B]"
                        : "bg-[#FCFCF9] text-[#526A80] border-[#D3DDE5] hover:border-[#17283B]"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>{doc.title}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-[#347C70]" />}
                  </button>
                );
              })}
            </div>

            {/* Suggested Developer Queries */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F] py-1">
                Developer Prompts:
              </span>
              {[
                "Explain this architecture visually",
                "Turn this algorithm into a flowchart",
                "Show how these components communicate",
                "Explain this API request and response sequence",
                "Identify dependencies between components",
                "Extract the system requirements",
                "Identify missing requirements or inconsistent statements",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(q)}
                  className="text-xs px-2.5 py-1 rounded bg-[#E8EEF2] hover:bg-[#D3DDE5] text-[#17283B] font-medium transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Persistent Question Input */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunQA()}
                  placeholder="Ask a technical or architectural question about the selected documentation…"
                  className="w-full text-sm pl-9 pr-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md focus:border-[#17283B] outline-none"
                />
                <Search className="w-4 h-4 text-[#75808F] absolute left-3 top-3" />
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs text-[#526A80] cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={includeVisual}
                    onChange={(e) => setIncludeVisual(e.target.checked)}
                    className="rounded border-[#D3DDE5] text-[#17283B]"
                  />
                  <span>Visual Engine</span>
                </label>
                <button
                  onClick={handleRunQA}
                  disabled={loadingQA || !query.trim()}
                  className="px-6 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-sm font-semibold rounded-md flex items-center justify-center space-x-2"
                >
                  {loadingQA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  <span>Inspect Spec</span>
                </button>
              </div>
            </div>
          </div>

          {/* Answer Section */}
          {answerData && (
            <div className="space-y-6">
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8EEF2] pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#347C70]" />
                    <span className="text-xs font-bold uppercase text-[#526A80]">
                      Grounded Technical Answer
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-[#75808F]">
                    <span>{answerData.retrievedChunks.length} passages cited</span>
                  </div>
                </div>
                <p className="font-serif text-sm text-[#17283B] leading-relaxed">
                  {answerData.answer}
                </p>
              </div>

              {answerData.visual && answerData.visual.type !== "none" && (
                <VisualAnswerRenderer visual={answerData.visual} />
              )}

              <EvidenceLens claims={answerData.claims} retrievedChunks={answerData.retrievedChunks} />
              <EvidenceLineageView lineage={answerData.lineage} />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Regression Lab */}
      {activeTab === "regression" && (
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-6 shadow-editorial space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8EEF2] pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#17283B]" />
                <h2 className="font-editorial text-lg font-bold text-[#17283B]">
                  Retrieval & Synthesis Parameter Calibration
                </h2>
              </div>
              <button
                onClick={handleExecuteRegression}
                disabled={runningRegression}
                className="px-5 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center space-x-2 shadow-sm"
              >
                {runningRegression ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{runningRegression ? "Running Suite…" : "Execute Regression Suite"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#526A80] block mb-1">
                  Chunk Size (Tokens): {chunkSize}
                </label>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="50"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  className="w-full accent-[#17283B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526A80] block mb-1">
                  Top-K Retrieved: {topK}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-[#17283B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526A80] block mb-1">
                  Similarity Threshold: {similarityThreshold}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                  className="w-full accent-[#17283B]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526A80] block mb-1">
                  Generative Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs p-2 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md outline-none"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (High Speed)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary & Comparison */}
          {currentRun && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Overall Accuracy", val: `${(currentRun.metricsSummary.accuracy * 100).toFixed(1)}%` },
                  { label: "Citation Quality", val: `${(currentRun.metricsSummary.citationCorrectness * 100).toFixed(1)}%` },
                  { label: "Evidence Support", val: `${(currentRun.metricsSummary.supportRate * 100).toFixed(1)}%` },
                  { label: "Abstention F1", val: `${(currentRun.metricsSummary.abstentionF1 * 100).toFixed(1)}%` },
                  { label: "Precision", val: `${(currentRun.metricsSummary.precision * 100).toFixed(1)}%` },
                  { label: "Avg Latency", val: `${currentRun.metricsSummary.avgLatencyMs.toFixed(0)}ms` },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-[#526A80]">{item.label}</span>
                    <div className="font-editorial text-xl font-bold text-[#17283B] mt-1">{item.val}</div>
                  </div>
                ))}
              </div>

              {/* Case-by-case Results */}
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg shadow-editorial overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E8EEF2] flex items-center justify-between">
                  <h3 className="font-editorial text-base font-bold text-[#17283B]">
                    Benchmark Evaluation Cases ({currentRun.results?.length || 0})
                  </h3>
                  <a
                    href={`/api/reports/export?format=json&workspaceId=${workspaceId}`}
                    target="_blank"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#526A80] hover:text-[#17283B]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </a>
                </div>
                <div className="divide-y divide-[#E8EEF2]">
                  {currentRun.results?.map((res) => (
                    <div key={res.id} className="p-4 hover:bg-[#FCFCF9] transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#17283B]">{res.question}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            res.judgeVerdict === "passed"
                              ? "bg-[#EBF5F3] text-[#347C70]"
                              : "bg-[#FDF1F1] text-[#B65353]"
                          }`}
                        >
                          {res.judgeVerdict.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-serif text-xs text-[#4E5763] leading-relaxed">
                        {res.actualOutput}
                      </p>
                      <div className="flex items-center space-x-4 text-[11px] text-[#526A80]">
                        <span>Citations: {res.actualCitations.length}</span>
                        <span>Support Rate: {(res.evidenceSupportRate * 100).toFixed(0)}%</span>
                        <span>Latency: {res.latencyMs}ms</span>
                        {res.didAbstain && <span className="font-semibold text-[#B98237]">Abstained (Correct)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Adversarial Stress Suite */}
      {activeTab === "stress" && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-6 shadow-editorial flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#B65353] mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>RAG Boundary & Adversarial Injection Testing</span>
              </div>
              <h3 className="font-editorial text-lg font-bold text-[#17283B]">
                Adversarial Defense & Citation Integrity Stress Suite
              </h3>
              <p className="text-xs text-[#526A80] mt-1">
                Stress test prompt injection sanitization, unanswerable questions, and citation mismatch traps.
              </p>
            </div>
            <button
              onClick={handleRunStressSuite}
              disabled={runningStress}
              className="px-5 py-2.5 bg-[#B65353] hover:bg-[#9E4141] disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center space-x-2"
            >
              {runningStress ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{runningStress ? "Stress Testing…" : "Run Stress Suite"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_STRESS_TEST_CASES.map((tc) => (
              <div key={tc.id} className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E8EEF2] text-[#526A80]">
                    {tc.category.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-[#75808F]">
                    Expected Abstain: {tc.expectedAbstention ? "Yes" : "No"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#17283B]">{tc.question}</p>
                {tc.expectedEvidence && (
                  <p className="text-[11px] font-mono text-[#526A80]">
                    Required: {tc.expectedEvidence}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Metric Definitions */}
      {activeTab === "metrics" && (
        <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-6 shadow-editorial space-y-4">
          <h3 className="font-editorial text-lg font-bold text-[#17283B]">
            Evaluation Metric Definitions & Measurement Standards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(EVAL_METRIC_DEFINITIONS).map((m: any, idx: number) => (
              <div key={idx} className="p-4 rounded-lg border border-[#D3DDE5] bg-[#FCFCF9] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#17283B]">{m.name}</span>
                  <span className="text-[10px] font-mono text-[#526A80]">{m.targetThreshold}</span>
                </div>
                <p className="text-xs text-[#526A80] leading-relaxed">{m.description}</p>
                <div className="text-[11px] font-mono text-[#17283B] pt-1">
                  Formula: {m.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
