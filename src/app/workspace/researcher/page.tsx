"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Microscope,
  BookOpen,
  Search,
  Sparkles,
  GitCompare,
  ExternalLink,
  Layers,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  GitMerge,
  Bookmark,
  X,
  ArrowRight,
  Download,
  Filter,
  CheckSquare,
  Square,
} from "lucide-react";
import { EvidenceLens } from "@/components/evidence/EvidenceLens";
import { EvidenceLineageView } from "@/components/lineage/EvidenceLineageView";
import { VisualAnswerRenderer } from "@/components/visualization/VisualAnswerRenderer";
import { PaperUpload, UploadedPaper } from "@/components/ui/PaperUpload";
import { PaperOverviewCard, PaperOverview } from "@/components/ui/PaperOverviewCard";
import {
  Claim,
  DocumentChunk,
  LineageGraph,
  AbstentionType,
  VisualExplanation,
  ScholarlyPaper,
  PaperComparisonReport,
} from "@/lib/rag/types";

type ResearcherTab = "overview" | "qa" | "compare" | "discover" | "reproducibility" | "notes";

interface PaperSession {
  paper: UploadedPaper;
  overview: PaperOverview | null;
  loadingOverview: boolean;
}

export default function ResearcherWorkspacePage() {
  const [papers, setPapers] = useState<PaperSession[]>([
    {
      paper: {
        documentId: "doc-clinical-v1",
        versionId: "ver-doc-clinical-v1-1",
        workspaceId: "demo-workspace",
        title: "Phase III Clinical Protocol: PT-902 Efficacy Analysis",
        totalPages: 2,
        totalChunks: 2,
      },
      overview: {
        title: "Phase III Clinical Protocol: PT-902 Efficacy Analysis",
        summary:
          "Multicenter Phase III evaluation of PT-902 evaluating efficacy and safety across 450 adult patients in 12 clinical centers.",
        researchQuestion:
          "Does PT-902 administration lead to significant symptom severity score reduction at week 12 compared to placebo?",
        methodology:
          "Randomized cohort trial with 25mg administered twice daily with meals and mandatory bi-weekly clinic monitoring.",
        keyFindings: [
          "74.2% overall response rate in treatment cohort vs 31.8% in placebo group.",
          "Mild nausea observed in 8.4% of patients; severe adverse events in 1.1%.",
        ],
        limitations: [
          "Excludes patients with creatinine clearance below 30 mL/min.",
          "Remote telehealth monitoring is explicitly prohibited for vital signs.",
        ],
        assumptions: [
          "Patients maintain strict adherence to twice-daily dosing with meals.",
        ],
        potentialWeaknesses: [
          "On-site visit requirement may impact patient retention across geographic barriers.",
        ],
        totalChunks: 2,
        totalPages: 2,
      },
      loadingOverview: false,
    },
    {
      paper: {
        documentId: "doc-clinical-v2",
        versionId: "ver-doc-clinical-v2-2",
        workspaceId: "demo-workspace",
        title: "Phase III Protocol Amendment: PT-902 Revised Guidelines (v2)",
        totalPages: 2,
        totalChunks: 2,
      },
      overview: {
        title: "Phase III Protocol Amendment: PT-902 Revised Guidelines (v2)",
        summary:
          "Protocol amendment expanding clinical trial cohort to 600 patients across 16 global sites with once-daily dosing.",
        researchQuestion:
          "Can once-daily 50mg dosing maintain therapeutic efficacy while improving compliance through virtual monitoring?",
        methodology:
          "Amended dosing schedule of 50mg once daily with telehealth visits authorized for routine week 4 and week 8 assessments.",
        keyFindings: [
          "Pharmacokinetic tolerance confirmed for 50mg once-daily single dose.",
          "Expanded global cohort of 600 adult participants approved by ethics board.",
        ],
        limitations: [
          "Requires expedited 24-hour reporting for Grade 3+ toxicities.",
        ],
        assumptions: [
          "Remote telemetry vitals are clinically equivalent to physical on-site visits.",
        ],
        potentialWeaknesses: [
          "Potential variability in home patient monitoring devices.",
        ],
        totalChunks: 2,
        totalPages: 2,
      },
      loadingOverview: false,
    },
  ]);

  const [activePaperIndex, setActivePaperIndex] = useState(0);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(["doc-clinical-v1"]);
  const [activeTab, setActiveTab] = useState<ResearcherTab>("overview");
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  // Q&A state
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeVisual, setIncludeVisual] = useState(true);
  const [answerData, setAnswerData] = useState<{
    answer: string;
    abstentionType: AbstentionType;
    claims: Claim[];
    retrievedChunks: DocumentChunk[];
    lineage: LineageGraph;
    visual: VisualExplanation | null;
  } | null>(null);

  // Multi-Paper Comparison state
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([
    "doc-clinical-v1",
    "doc-clinical-v2",
  ]);
  const [comparisonReport, setComparisonReport] = useState<PaperComparisonReport | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Scholarly Discovery state
  const [scholarlyQuery, setScholarlyQuery] = useState("");
  const [scholarlyPapers, setScholarlyPapers] = useState<ScholarlyPaper[]>([]);
  const [loadingScholarly, setLoadingScholarly] = useState(false);
  const [scholarlySource, setScholarlySource] = useState("");

  // Reproducibility Checklist state
  const [reproChecks, setReproChecks] = useState<Record<string, boolean>>({
    methodologyStated: true,
    sampleSizeDisclosed: true,
    evaluationMetricsClear: true,
    exclusionCriteriaDocumented: true,
    rawCodeOrWeightsAvailable: false,
    randomSeedsReported: false,
  });

  const workspaceId = "demo-workspace";
  const activePaper = papers[activePaperIndex] ?? null;

  const handleUploadSuccess = useCallback(async (uploaded: UploadedPaper) => {
    const newSession: PaperSession = {
      paper: uploaded,
      overview: null,
      loadingOverview: true,
    };
    setPapers((prev) => {
      const next = [...prev, newSession];
      setActivePaperIndex(next.length - 1);
      return next;
    });
    setSelectedDocIds([uploaded.documentId]);
    setShowUploadPanel(false);
    setActiveTab("overview");
    setAnswerData(null);

    try {
      const res = await fetch("/api/paper/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploaded.documentId,
          workspaceId,
          title: uploaded.title,
        }),
      });
      const data = await res.json();
      if (data.overview) {
        setPapers((prev) =>
          prev.map((s) =>
            s.paper.documentId === uploaded.documentId
              ? { ...s, overview: data.overview, loadingOverview: false }
              : s
          )
        );
      }
    } catch {
      setPapers((prev) =>
        prev.map((s) =>
          s.paper.documentId === uploaded.documentId ? { ...s, loadingOverview: false } : s
        )
      );
    }
  }, [workspaceId]);

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (selectedCompareIds.length < 2) return;
    setLoadingCompare(true);
    try {
      const res = await fetch("/api/research/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperIds: selectedCompareIds,
          workspaceId,
        }),
      });
      const data = await res.json();
      if (data.report) setComparisonReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleDiscoverScholarly = async () => {
    setLoadingScholarly(true);
    try {
      const res = await fetch("/api/research/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: scholarlyQuery || activePaper?.paper.title || "",
          paperTitle: activePaper?.paper.title || "",
          abstract: activePaper?.overview?.summary || "",
        }),
      });
      const data = await res.json();
      if (data.papers) {
        setScholarlyPapers(data.papers);
        setScholarlySource(data.source);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScholarly(false);
    }
  };

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleCompareDoc = (id: string) => {
    setSelectedCompareIds((prev) =>
      prev.includes(id)
        ? prev.length > 2
          ? prev.filter((d) => d !== id)
          : prev
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#347C70] mb-1">
              <Microscope className="w-4 h-4 text-[#347C70]" />
              <span>Academic Researcher Workspace</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#17283B]">
              Scientific Evidence & Multi-Paper Analysis
            </h1>
            <p className="text-xs text-[#526A80] mt-1 max-w-2xl leading-relaxed">
              Explore academic papers, examine methodologies, generate grounded visual process diagrams,
              compare multiple studies across scientific dimensions, and discover related peer-reviewed literature.
            </p>
          </div>

          <button
            onClick={() => setShowUploadPanel((v) => !v)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#17283B] hover:bg-[#223B56] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex-shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Paper</span>
          </button>
        </div>

        {/* Upload Panel */}
        {showUploadPanel && (
          <div className="mt-4 pt-4 border-t border-[#E8EEF2]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#526A80]">
                Add Academic Paper (PDF / Markdown / TXT)
              </span>
              <button onClick={() => setShowUploadPanel(false)}>
                <X className="w-4 h-4 text-[#75808F] hover:text-[#17283B]" />
              </button>
            </div>
            <PaperUpload workspaceId={workspaceId} onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Active Paper Selector & Context Filters */}
        <div className="mt-4 pt-4 border-t border-[#E8EEF2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F]">
              Query Scope:
            </span>
            {papers.map((session, idx) => {
              const isSelected = selectedDocIds.includes(session.paper.documentId);
              return (
                <button
                  key={session.paper.documentId}
                  onClick={() => {
                    setActivePaperIndex(idx);
                    toggleDocSelection(session.paper.documentId);
                  }}
                  className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-[#17283B] text-white border-[#17283B]"
                      : "bg-[#FCFCF9] text-[#526A80] border-[#D3DDE5] hover:border-[#17283B]"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[160px] truncate">{session.paper.title}</span>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-[#347C70]" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 text-xs text-[#526A80]">
            <Filter className="w-3.5 h-3.5" />
            <span>{selectedDocIds.length} of {papers.length} documents in question scope</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-[#E8EEF2] p-1 rounded-lg text-xs font-semibold w-fit flex-wrap">
        {[
          { key: "overview", label: "Paper Overview", icon: FileText },
          { key: "qa", label: "Evidence Q&A", icon: Search },
          { key: "compare", label: "Multi-Paper Compare", icon: GitCompare },
          { key: "discover", label: "Related Scholarly Papers", icon: ExternalLink },
          { key: "reproducibility", label: "Reproducibility Audit", icon: CheckSquare },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as ResearcherTab)}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === key
                ? "bg-[#17283B] text-white shadow-sm"
                : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Paper Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {activePaper && (
            <PaperOverviewCard
              overview={
                activePaper.overview ?? {
                  title: activePaper.paper.title,
                  summary: "Analyzing research structure…",
                  researchQuestion: "",
                  methodology: "",
                  keyFindings: [],
                  limitations: [],
                  assumptions: [],
                  potentialWeaknesses: [],
                  totalChunks: activePaper.paper.totalChunks,
                  totalPages: activePaper.paper.totalPages,
                }
              }
              isLoading={activePaper.loadingOverview}
            />
          )}
        </div>
      )}

      {/* TAB 2: Evidence Q&A with Universal Visual Answering */}
      {activeTab === "qa" && (
        <div className="space-y-5">
          {/* Persistent Question Bar */}
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F] py-1">
                Suggested Research Questions:
              </span>
              {[
                "Explain the experimental methodology as a flowchart",
                "What are the primary quantitative findings and response rates?",
                "What limitations and potential weaknesses are acknowledged?",
                "Compare protocol v1 dosing vs amendment v2 in a table",
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

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunQuery()}
                  placeholder="Ask a deep research question about methodologies, claims, or statistics…"
                  className="w-full text-sm pl-9 pr-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md focus:border-[#17283B] focus:ring-1 focus:ring-[#17283B] outline-none"
                />
                <Search className="w-4 h-4 text-[#75808F] absolute left-3 top-3" />
              </div>

              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs text-[#526A80] cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={includeVisual}
                    onChange={(e) => setIncludeVisual(e.target.checked)}
                    className="rounded border-[#D3DDE5] text-[#17283B] focus:ring-[#17283B]"
                  />
                  <span>Visual Engine</span>
                </label>

                <button
                  onClick={handleRunQuery}
                  disabled={loading || !query.trim()}
                  className="px-6 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-sm font-semibold rounded-md flex items-center justify-center space-x-2 shadow-sm"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{loading ? "Synthesizing…" : "Investigate"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Answer Display */}
          {answerData && (
            <div className="space-y-6">
              {/* Textual Grounded Answer */}
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8EEF2] pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#347C70]" />
                    <span className="text-xs font-bold uppercase text-[#526A80]">
                      Evidence-Grounded Answer
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-[#75808F]">
                    <span>{answerData.retrievedChunks.length} passages cited</span>
                    {answerData.abstentionType !== "none" && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#FDF7ED] text-[#B98237] border border-[#B98237]/30">
                        {answerData.abstentionType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-serif text-sm sm:text-base text-[#17283B] leading-relaxed">
                  {answerData.answer}
                </p>
              </div>

              {/* Universal Visual Explanation */}
              {answerData.visual && answerData.visual.type !== "none" && (
                <VisualAnswerRenderer visual={answerData.visual} />
              )}

              {/* Evidence Lens */}
              <EvidenceLens
                claims={answerData.claims}
                retrievedChunks={answerData.retrievedChunks}
                onClaimStatusOverride={(claimId, newStatus) => {
                  setAnswerData((prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      claims: prev.claims.map((c) =>
                        c.id === claimId ? { ...c, status: newStatus } : c
                      ),
                    };
                  });
                }}
              />

              {/* Evidence Lineage Graph */}
              <EvidenceLineageView lineage={answerData.lineage} />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Multi-Paper Comparison */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#17283B] flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-[#347C70]" />
                <span>Multi-Paper Meta-Analysis & Comparison Matrix</span>
              </h2>
              <p className="text-xs text-[#526A80] mt-1">
                Select 2 or more research papers to execute side-by-side comparative analysis across objectives,
                cohorts, methodologies, and quantitative results.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#75808F]">
                Select Papers to Compare:
              </span>
              {papers.map((p) => {
                const isSelected = selectedCompareIds.includes(p.paper.documentId);
                return (
                  <button
                    key={p.paper.documentId}
                    onClick={() => toggleCompareDoc(p.paper.documentId)}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-[#17283B] text-white border-[#17283B]"
                        : "bg-white text-[#526A80] border-[#D3DDE5] hover:border-[#17283B]"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#347C70]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#75808F]" />
                    )}
                    <span>{p.paper.title}</span>
                  </button>
                );
              })}

              <button
                onClick={handleRunComparison}
                disabled={loadingCompare || selectedCompareIds.length < 2}
                className="ml-auto px-5 py-2 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center space-x-2"
              >
                {loadingCompare ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BarChart3 className="w-3.5 h-3.5" />
                )}
                <span>{loadingCompare ? "Analyzing Papers…" : "Run Comparison"}</span>
              </button>
            </div>
          </div>

          {comparisonReport && (
            <div className="space-y-6">
              {/* Written Synthesis */}
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-3">
                <h3 className="font-editorial text-lg font-bold text-[#17283B]">
                  Comparative Meta-Synthesis
                </h3>
                <p className="font-serif text-sm text-[#17283B] leading-relaxed">
                  {comparisonReport.writtenSynthesis}
                </p>
              </div>

              {/* Side-by-Side Dimension Matrix */}
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-4">
                <h3 className="font-editorial text-lg font-bold text-[#17283B]">
                  Cross-Paper Dimension Matrix
                </h3>
                <div className="overflow-x-auto border border-[#D3DDE5] rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#FCFCF9] border-b border-[#D3DDE5] text-[#17283B] font-bold">
                      <tr>
                        <th className="px-4 py-3 border-r border-[#E8EEF2]">Dimension</th>
                        {comparisonReport.paperTitles.map((title, i) => (
                          <th key={i} className="px-4 py-3 border-r border-[#E8EEF2] last:border-r-0">
                            {title}
                          </th>
                        ))}
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EEF2]">
                      {comparisonReport.dimensionMatrix.map((dim, idx) => (
                        <tr key={idx} className="hover:bg-[#FCFCF9]/70">
                          <td className="px-4 py-3 font-semibold text-[#17283B] border-r border-[#E8EEF2]">
                            {dim.dimension}
                          </td>
                          {comparisonReport.paperTitles.map((title, tIdx) => (
                            <td key={tIdx} className="px-4 py-3 border-r border-[#E8EEF2] text-[#252B33]">
                              <p>{dim.values[title] || "Not documented"}</p>
                              {dim.citations?.[title] && (
                                <p className="mt-1 text-[11px] font-mono text-[#526A80] italic">
                                  &ldquo;{dim.citations[title]}&rdquo;
                                </p>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                dim.status === "agreement"
                                  ? "bg-[#EBF5F3] text-[#347C70]"
                                  : dim.status === "difference"
                                  ? "bg-[#FDF7ED] text-[#B98237]"
                                  : "bg-[#E8EEF2] text-[#526A80]"
                              }`}
                            >
                              {dim.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Divergence & Research Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B98237] flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Disagreements & Divergences</span>
                  </h4>
                  {comparisonReport.disagreements.map((d, i) => (
                    <div key={i} className="p-3 bg-[#FCFCF9] border border-[#E8EEF2] rounded-lg text-xs space-y-1.5">
                      <div className="font-bold text-[#17283B]">{d.topic}</div>
                      <p className="text-[#526A80]">{d.explanation}</p>
                      <div className="border-t border-[#E8EEF2] pt-1 text-[11px] font-mono space-y-0.5">
                        <div className="text-[#347C70]">&ldquo;{d.docAQuote}&rdquo;</div>
                        <div className="text-[#B98237]">&ldquo;{d.docBQuote}&rdquo;</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#17283B] flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-[#347C70]" />
                    <span>Unexplored Research Gaps</span>
                  </h4>
                  {comparisonReport.researchGaps.map((gap, i) => (
                    <div key={i} className="p-3 bg-[#EBF5F3]/50 border border-[#347C70]/20 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-[#347C70]">Research Opportunity #{i + 1}</div>
                      <p className="text-[#252B33] leading-relaxed">{gap}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Related Scholarly Research */}
      {activeTab === "discover" && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#17283B] flex items-center space-x-2">
                <ExternalLink className="w-5 h-5 text-[#347C70]" />
                <span>Scholarly Research Discovery (OpenAlex & Peer-Reviewed Catalog)</span>
              </h2>
              <p className="text-xs text-[#526A80] mt-1">
                Query global academic bibliographic catalogs to discover related peer-reviewed studies,
                baseline papers, follow-up trials, and alternative approaches.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                value={scholarlyQuery}
                onChange={(e) => setScholarlyQuery(e.target.value)}
                placeholder={
                  activePaper
                    ? `Search scholarly works related to: ${activePaper.paper.title}`
                    : "Enter keywords or topic…"
                }
                className="flex-1 text-sm px-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md outline-none focus:border-[#17283B]"
              />
              <button
                onClick={handleDiscoverScholarly}
                disabled={loadingScholarly}
                className="px-6 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-sm font-semibold rounded-md flex items-center justify-center space-x-2 shadow-sm"
              >
                {loadingScholarly ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{loadingScholarly ? "Searching Catalogs…" : "Discover Papers"}</span>
              </button>
            </div>

            {scholarlySource && (
              <div className="flex items-center space-x-2 text-xs text-[#526A80]">
                <span>Source:</span>
                <span className="font-semibold text-[#17283B]">{scholarlySource}</span>
                <span>·</span>
                <span>{scholarlyPapers.length} publications indexed</span>
              </div>
            )}
          </div>

          {scholarlyPapers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {scholarlyPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF5F3] text-[#347C70] border border-[#347C70]/20">
                        {paper.relationshipType.replace("_", " ")}
                      </span>
                      {paper.year && (
                        <span className="text-xs font-mono text-[#75808F]">{paper.year}</span>
                      )}
                    </div>
                    <h4 className="font-editorial text-base font-bold text-[#17283B] leading-tight">
                      {paper.title}
                    </h4>
                    <p className="text-xs text-[#526A80]">
                      {paper.authors.join(", ")} · <span className="italic">{paper.venue}</span>
                    </p>
                    <p className="text-xs text-[#252B33] line-clamp-3 leading-relaxed">
                      {paper.abstract}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E8EEF2] space-y-2">
                    <div className="text-[11px] text-[#347C70] font-medium bg-[#EBF5F3]/50 p-2 rounded">
                      Relationship: {paper.relationshipToUploadedPaper}
                    </div>
                    <div className="flex items-center justify-between">
                      {paper.url ? (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs text-[#17283B] hover:text-[#347C70] font-semibold"
                        >
                          <span>{paper.doi || "View Publication"}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-[#75808F]">Local Workspace Library</span>
                      )}
                      <span className="text-[11px] text-[#75808F]">
                        Score: {(paper.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Reproducibility Audit */}
      {activeTab === "reproducibility" && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#17283B] flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-[#347C70]" />
                <span>Academic Reproducibility & Rigor Checklist</span>
              </h2>
              <p className="text-xs text-[#526A80] mt-1">
                Audit methodological rigor, statistical disclosure, and reproducibility standards for &ldquo;
                {activePaper?.paper.title}&rdquo;.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  key: "methodologyStated",
                  label: "Clear Methodology & Experimental Setup",
                  desc: "Document details step-by-step procedure and operational parameters.",
                },
                {
                  key: "sampleSizeDisclosed",
                  label: "Sample Size & Population Cohorts Disclosed",
                  desc: "Includes patient / subject counts and geographic site distribution.",
                },
                {
                  key: "evaluationMetricsClear",
                  label: "Primary Evaluation Endpoints & Metrics Specified",
                  desc: "Specific statistical criteria (e.g. symptom score reduction, response rate).",
                },
                {
                  key: "exclusionCriteriaDocumented",
                  label: "Exclusion & Inclusion Criteria Defined",
                  desc: "Clear boundary conditions on eligible trial participants.",
                },
                {
                  key: "rawCodeOrWeightsAvailable",
                  label: "Open Source Code / Protocol Scripts / Weights Linked",
                  desc: "Verifiable repository or persistent artifact link provided.",
                },
                {
                  key: "randomSeedsReported",
                  label: "Random Seeds & Initialization Parameters Documented",
                  desc: "Exact execution seeds for algorithmic determinism.",
                },
              ].map(({ key, label, desc }) => {
                const checked = reproChecks[key];
                return (
                  <div
                    key={key}
                    onClick={() =>
                      setReproChecks((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-start space-x-3 ${
                      checked
                        ? "bg-[#EBF5F3]/50 border-[#347C70]/30"
                        : "bg-[#FCFCF9] border-[#D3DDE5] hover:border-[#17283B]"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#347C70]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#75808F]" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#17283B]">{label}</div>
                      <div className="text-xs text-[#526A80] mt-0.5">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
