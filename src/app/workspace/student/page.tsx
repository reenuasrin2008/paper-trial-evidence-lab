"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Upload,
  ArrowRight,
  FileText,
  Plus,
  GitCompare,
  Bookmark,
  X,
  BarChart3,
} from "lucide-react";
import { EvidenceLens } from "@/components/evidence/EvidenceLens";
import { EvidenceLineageView } from "@/components/lineage/EvidenceLineageView";
import { VisualAnswerRenderer } from "@/components/visualization/VisualAnswerRenderer";
import { PaperUpload, UploadedPaper } from "@/components/ui/PaperUpload";
import { PaperOverviewCard, PaperOverview } from "@/components/ui/PaperOverviewCard";
import { Claim, DocumentChunk, LineageGraph, AbstentionType, VisualExplanation } from "@/lib/rag/types";
import { GeneratedStudyGuide, StudentNote } from "@/lib/student/study-service";

type ActiveTab = "qa" | "overview" | "study-guide" | "compare" | "notes";
type ExplanationLevel = "simple" | "standard" | "detailed";

interface PaperSession {
  paper: UploadedPaper;
  overview: PaperOverview | null;
  loadingOverview: boolean;
}

export default function StudentWorkspacePage() {
  const [papers, setPapers] = useState<PaperSession[]>([]);
  const [activePaperIndex, setActivePaperIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>("qa");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>("standard");

  // Q&A state
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<{
    answer: string;
    abstentionType: AbstentionType;
    claims: Claim[];
    retrievedChunks: DocumentChunk[];
    lineage: LineageGraph;
    visual?: VisualExplanation | null;
  } | null>(null);

  // Study Guide state
  const [studyTopic, setStudyTopic] = useState("");
  const [studyGuide, setStudyGuide] = useState<GeneratedStudyGuide | null>(null);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});

  // Notes state
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Compare state
  const [compareQuery, setCompareQuery] = useState("");
  const [compareResults, setCompareResults] = useState<Record<string, {answer: string; chunks: DocumentChunk[]}>>({});
  const [loadingCompare, setLoadingCompare] = useState(false);

  const workspaceId = "demo-workspace";
  const activePaper = papers[activePaperIndex] ?? null;

  const handleUploadSuccess = useCallback(async (paper: UploadedPaper) => {
    const newSession: PaperSession = { paper, overview: null, loadingOverview: true };
    setPapers((prev) => {
      const next = [...prev, newSession];
      setActivePaperIndex(next.length - 1);
      return next;
    });
    setShowUploadPanel(false);
    setActiveTab("overview");
    setAnswerData(null);

    // Auto-generate paper overview
    try {
      const res = await fetch("/api/paper/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: paper.documentId, workspaceId, title: paper.title }),
      });
      const data = await res.json();
      if (data.overview) {
        setPapers((prev) =>
          prev.map((s) =>
            s.paper.documentId === paper.documentId
              ? { ...s, overview: data.overview, loadingOverview: false }
              : s
          )
        );
      }
    } catch {
      setPapers((prev) =>
        prev.map((s) =>
          s.paper.documentId === paper.documentId ? { ...s, loadingOverview: false } : s
        )
      );
    }
  }, [workspaceId]);

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const documentIds = activePaper ? [activePaper.paper.documentId] : undefined;
      const res = await fetch("/api/rag/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${query}${explanationLevel === "simple" ? " (Explain simply for students)" : explanationLevel === "detailed" ? " (Provide detailed comprehensive explanation)" : ""}`,
          workspaceId,
          documentIds,
          topK: 6,
          includeVisual: true,
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

  const handleGenerateStudyGuide = async () => {
    if (!studyTopic.trim()) return;
    setGeneratingGuide(true);
    try {
      const res = await fetch("/api/student/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, topic: studyTopic }),
      });
      const data = await res.json();
      if (data.studyGuide) setStudyGuide(data.studyGuide);
    } finally {
      setGeneratingGuide(false);
    }
  };

  const handleCompare = async () => {
    if (!compareQuery.trim() || papers.length < 2) return;
    setLoadingCompare(true);
    const results: Record<string, {answer: string; chunks: DocumentChunk[]}> = {};
    for (const session of papers) {
      try {
        const res = await fetch("/api/rag/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: compareQuery,
            workspaceId,
            documentIds: [session.paper.documentId],
            topK: 3,
          }),
        });
        const data = await res.json();
        results[session.paper.documentId] = { answer: data.answer, chunks: data.retrievedChunks };
      } catch { /* silent */ }
    }
    setCompareResults(results);
    setLoadingCompare(false);
  };

  const handleSaveNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    try {
      const res = await fetch("/api/student/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: newNoteTitle,
          content: newNoteContent,
          sourceDocumentTitle: activePaper?.paper.title || "",
          sourcePage: 1,
        }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteTitle("");
        setNewNoteContent("");
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetch(`/api/student/notes?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => { if (d.notes) setNotes(d.notes); })
      .catch(() => {});
  }, []);

  const sampleQueries = [
    "Explain this topic in simple words",
    "Show this process as a flowchart",
    "Explain this chapter step by step",
    "Create a concept map of the main ideas",
    "Compare these two concepts in a table",
    "Give an example based on the uploaded material",
    "Create revision notes and practice questions",
  ];

  const noPapers = papers.length === 0;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#526A80] mb-1">
              <BookOpen className="w-4 h-4 text-[#17283B]" />
              <span>Research Paper Understanding Lab</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#17283B]">
              Evidence-Based Paper Analysis
            </h1>
            <p className="text-xs text-[#526A80] mt-1 max-w-xl">
              Upload research papers to get structured overviews, ask evidence-grounded questions
              with cited passages, generate study guides, and compare multiple papers.
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
                Add Research Paper
              </span>
              <button onClick={() => setShowUploadPanel(false)}>
                <X className="w-4 h-4 text-[#75808F] hover:text-[#17283B]" />
              </button>
            </div>
            <PaperUpload workspaceId={workspaceId} onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Paper Tabs */}
        {papers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E8EEF2] flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F]">
              Loaded Papers:
            </span>
            {papers.map((session, idx) => (
              <button
                key={session.paper.documentId}
                onClick={() => { setActivePaperIndex(idx); setAnswerData(null); }}
                className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full border transition-colors ${
                  activePaperIndex === idx
                    ? "bg-[#17283B] text-white border-[#17283B]"
                    : "bg-[#FCFCF9] text-[#526A80] border-[#D3DDE5] hover:border-[#17283B]"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span className="max-w-[140px] truncate">{session.paper.title}</span>
              </button>
            ))}
            {papers.length >= 2 && (
              <button
                onClick={() => setActiveTab("compare")}
                className="inline-flex items-center space-x-1 text-xs px-3 py-1 rounded-full border border-[#D3DDE5] bg-[#FDF7ED] text-[#B98237] hover:border-[#B98237] transition-colors"
              >
                <GitCompare className="w-3 h-3" />
                <span>Compare Papers</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty state — no papers uploaded yet */}
      {noPapers && !showUploadPanel && (
        <div className="bg-[#FFFFFF] border-2 border-dashed border-[#D3DDE5] rounded-xl p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#E8EEF2] flex items-center justify-center mx-auto">
            <BookOpen className="w-9 h-9 text-[#526A80]" />
          </div>
          <div>
            <h2 className="font-editorial text-xl font-bold text-[#17283B]">
              Upload your first research paper
            </h2>
            <p className="text-sm text-[#526A80] mt-2 max-w-lg mx-auto leading-relaxed">
              PaperTrail will extract and index every passage. Ask questions in natural language and
              receive answers with clickable citations linked to exact source passages.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <PaperUpload workspaceId={workspaceId} onUploadSuccess={handleUploadSuccess} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-[#75808F]">
            <span>✓ Structured overview generated automatically</span>
            <span>✓ Evidence-grounded Q&A with page citations</span>
            <span>✓ Study guide & revision quiz</span>
            <span>✓ Compare multiple papers</span>
          </div>
        </div>
      )}

      {/* Main workspace — paper loaded */}
      {!noPapers && (
        <>
          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 bg-[#E8EEF2] p-1 rounded-lg text-xs font-semibold w-fit">
            {[
              { key: "overview", label: "Paper Overview", icon: FileText },
              { key: "qa", label: "Evidence Q&A", icon: Search },
              { key: "study-guide", label: "Study Guide", icon: Sparkles },
              { key: "compare", label: "Compare", icon: GitCompare, disabled: papers.length < 2 },
              { key: "notes", label: `Notes (${notes.length})`, icon: Bookmark },
            ].map(({ key, label, icon: Icon, disabled }) => (
              <button
                key={key}
                onClick={() => !disabled && setActiveTab(key as ActiveTab)}
                disabled={disabled}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeTab === key
                    ? "bg-[#17283B] text-[#FFFFFF] shadow-sm"
                    : "text-[#526A80] hover:text-[#17283B]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* ── TAB: Overview ── */}
          {activeTab === "overview" && (
            <div>
              {activePaper && (
                <PaperOverviewCard
                  overview={activePaper.overview ?? {
                    title: activePaper.paper.title,
                    summary: "Generating overview…",
                    researchQuestion: "",
                    methodology: "",
                    keyFindings: [],
                    limitations: [],
                    assumptions: [],
                    potentialWeaknesses: [],
                    totalChunks: activePaper.paper.totalChunks,
                    totalPages: activePaper.paper.totalPages,
                  }}
                  isLoading={activePaper.loadingOverview}
                />
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setActiveTab("qa")}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#17283B] hover:bg-[#223B56] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Start Evidence Q&A</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: Evidence Q&A ── */}
          {activeTab === "qa" && (
            <div className="space-y-5">
              {/* Query Input */}
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-5 shadow-editorial space-y-4">
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F]">
                    Try:
                  </span>
                  {sampleQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(q); }}
                      className="text-xs px-2.5 py-1 rounded bg-[#E8EEF2] hover:bg-[#D3DDE5] text-[#17283B] font-medium transition-colors max-w-xs truncate"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRunQuery()}
                      placeholder="Ask about this paper — findings, methodology, limitations, claims…"
                      className="w-full text-sm pl-9 pr-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md focus:border-[#17283B] focus:ring-1 focus:ring-[#17283B] outline-none"
                    />
                    <Search className="w-4 h-4 text-[#75808F] absolute left-3 top-3" />
                  </div>
                  <button
                    onClick={handleRunQuery}
                    disabled={loading || !query.trim()}
                    className="px-6 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-sm font-semibold rounded-md flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{loading ? "Verifying…" : "Verify Sources"}</span>
                  </button>
                </div>

                {/* Explanation Level Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E8EEF2]">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526A80]">
                      Explanation Level:
                    </span>
                    <div className="inline-flex rounded-lg border border-[#D3DDE5] p-0.5 bg-[#E8EEF2]">
                      {(["simple", "standard", "detailed"] as ExplanationLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setExplanationLevel(level)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                            explanationLevel === level
                              ? "bg-white text-[#17283B] shadow-sm"
                              : "text-[#526A80] hover:text-[#17283B]"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activePaper && (
                    <div className="text-[10px] text-[#75808F] flex items-center space-x-1.5">
                      <FileText className="w-3 h-3" />
                      <span>Searching within: <span className="font-semibold text-[#526A80]">{activePaper.paper.title}</span></span>
                      <span>·</span>
                      <span>{activePaper.paper.totalChunks} passages</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer */}
              {answerData && (
                <div className="space-y-5">
                  <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-6 shadow-editorial space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E8EEF2] pb-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-[#347C70]" />
                        <span className="text-xs font-bold uppercase text-[#526A80]">
                          Evidence-Grounded Answer ({explanationLevel})
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

                  <EvidenceLineageView lineage={answerData.lineage} />
                </div>
              )}

              {!answerData && !loading && (
                <div className="text-center py-12 text-[#75808F] text-sm">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>Ask a question above to get evidence-grounded answers with source citations.</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Study Guide ── */}
          {activeTab === "study-guide" && (
            <div className="space-y-5">
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-5 shadow-editorial space-y-4">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#17283B]">
                    Generate Study Guide
                  </h3>
                  <p className="text-xs text-[#526A80] mt-1">
                    PaperTrail generates a structured study guide with source-backed concepts and
                    a revision quiz with page-cited answers.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={studyTopic}
                    onChange={(e) => setStudyTopic(e.target.value)}
                    placeholder={
                      activePaper
                        ? `Topic from "${activePaper.paper.title}"…`
                        : "Enter study topic…"
                    }
                    className="flex-1 text-sm px-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md outline-none focus:border-[#17283B]"
                  />
                  <button
                    onClick={handleGenerateStudyGuide}
                    disabled={generatingGuide || !studyTopic.trim()}
                    className="px-6 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-sm font-semibold rounded-md flex items-center justify-center space-x-2"
                  >
                    {generatingGuide ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {studyGuide && (
                <div className="space-y-5">
                  <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-6 shadow-editorial">
                    <h3 className="font-editorial text-xl font-bold text-[#17283B] mb-2">{studyGuide.title}</h3>
                    <p className="text-sm text-[#4E5763] leading-relaxed mb-5">{studyGuide.executiveSummary}</p>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#526A80] mb-3">Key Concepts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studyGuide.keyConcepts.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-lg border border-[#D3DDE5] bg-[#FCFCF9] space-y-2">
                          <div className="font-semibold text-xs text-[#17283B]">{item.concept}</div>
                          <p className="text-xs text-[#4E5763] leading-relaxed">{item.explanation}</p>
                          <div className="pt-2 border-t border-[#E8EEF2] text-[11px] italic text-[#526A80]">
                            &ldquo;{item.sourceQuote}&rdquo; — Page {item.pageNumber}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-6 shadow-editorial space-y-4">
                    <div className="flex items-center space-x-2 border-b border-[#E8EEF2] pb-3">
                      <HelpCircle className="w-4 h-4 text-[#17283B]" />
                      <h3 className="font-editorial text-lg font-bold text-[#17283B]">Revision Quiz</h3>
                    </div>
                    {studyGuide.quizQuestions.map((q) => {
                      const selected = selectedQuizAnswers[q.id];
                      const hasAnswered = selected !== undefined;
                      const isCorrect = selected === q.correctOptionIndex;
                      return (
                        <div key={q.id} className="space-y-3 p-4 rounded-lg border border-[#D3DDE5] bg-[#FCFCF9]">
                          <p className="text-xs font-semibold text-[#17283B]">{q.question}</p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() =>
                                  setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                }
                                className={`w-full text-left p-2.5 rounded text-xs border transition-colors ${
                                  selected === optIdx
                                    ? optIdx === q.correctOptionIndex
                                      ? "bg-[#EBF5F3] border-[#347C70] text-[#347C70] font-semibold"
                                      : "bg-[#FDF1F1] border-[#B65353] text-[#B65353]"
                                    : "bg-[#FFFFFF] border-[#D3DDE5] text-[#252B33] hover:bg-[#F7F6F2]"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {hasAnswered && (
                            <div className={`p-3 rounded text-xs leading-relaxed ${isCorrect ? "bg-[#EBF5F3] text-[#347C70]" : "bg-[#FDF1F1] text-[#B65353]"}`}>
                              <div className="font-bold mb-1">{isCorrect ? "✓ Correct!" : "✗ Incorrect"}</div>
                              <div>{q.explanation}</div>
                              <div className="text-[11px] font-mono mt-1 opacity-90">
                                Citation: &ldquo;{q.sourceCitation}&rdquo;
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Compare ── */}
          {activeTab === "compare" && papers.length >= 2 && (
            <div className="space-y-5">
              <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-5 shadow-editorial space-y-4">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#17283B] flex items-center space-x-2">
                    <GitCompare className="w-5 h-5" />
                    <span>Multi-Paper Comparison</span>
                  </h3>
                  <p className="text-xs text-[#526A80] mt-1">
                    Ask the same question across all {papers.length} uploaded papers and compare their answers side-by-side.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={compareQuery}
                    onChange={(e) => setCompareQuery(e.target.value)}
                    placeholder="e.g. What methodology does the paper use? What are the main limitations?"
                    className="flex-1 text-sm px-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md outline-none focus:border-[#17283B]"
                  />
                  <button
                    onClick={handleCompare}
                    disabled={loadingCompare || !compareQuery.trim()}
                    className="px-6 py-2.5 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-sm font-semibold rounded-md flex items-center justify-center space-x-2"
                  >
                    {loadingCompare ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    <span>Compare</span>
                  </button>
                </div>
              </div>

              {Object.keys(compareResults).length > 0 && (
                <div className={`grid grid-cols-1 gap-5 ${papers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                  {papers.map((session) => {
                    const result = compareResults[session.paper.documentId];
                    return (
                      <div
                        key={session.paper.documentId}
                        className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-5 shadow-editorial space-y-3"
                      >
                        <div className="flex items-start space-x-2 border-b border-[#E8EEF2] pb-3">
                          <FileText className="w-4 h-4 text-[#347C70] flex-shrink-0 mt-0.5" />
                          <span className="text-xs font-bold text-[#17283B] leading-tight">
                            {session.paper.title}
                          </span>
                        </div>
                        {result ? (
                          <>
                            <p className="font-serif text-xs text-[#252B33] leading-relaxed">
                              {result.answer}
                            </p>
                            <div className="text-[10px] text-[#75808F]">
                              {result.chunks.length} passages retrieved
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-[#75808F] italic">No result retrieved.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Notes ── */}
          {activeTab === "notes" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-5 bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-5 shadow-editorial space-y-3">
                <h3 className="font-editorial text-base font-bold text-[#17283B]">Add Research Note</h3>
                <input
                  type="text"
                  placeholder="Note title or key finding…"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded outline-none focus:border-[#17283B]"
                />
                <textarea
                  placeholder="Write detailed observations, deductions, or verbatim quotes…"
                  rows={5}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded outline-none resize-none focus:border-[#17283B]"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={!newNoteTitle || !newNoteContent}
                  className="w-full py-2 bg-[#17283B] hover:bg-[#223B56] disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                >
                  Save Note
                </button>
              </div>

              <div className="md:col-span-7 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#526A80]">
                  Research Notes ({notes.length})
                </h3>
                {notes.length === 0 ? (
                  <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-8 text-center text-[#75808F] text-xs">
                    No notes saved yet. Add key findings from your study sessions.
                  </div>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#17283B]">{n.title}</span>
                        <span className="text-[10px] text-[#75808F]">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#252B33] leading-relaxed">{n.content}</p>
                      {n.sourceDocumentTitle && (
                        <div className="text-[10px] text-[#526A80] pt-2 border-t border-[#E8EEF2]">
                          From: {n.sourceDocumentTitle} (p. {n.sourcePage || 1})
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
