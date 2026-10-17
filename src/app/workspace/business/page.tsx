"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  FileText,
  Clock,
  AlertCircle,
  FolderPlus,
  Download,
  CheckCircle2,
  Lock,
  Layers,
  RefreshCw,
  GitCommit,
  Upload,
  Filter,
  AlertTriangle,
  GitCompare,
  ArrowRight,
  Briefcase,
  Calendar,
  UserCheck,
} from "lucide-react";
import {
  AuditEvent,
  DocumentImpactLink,
  Claim,
  DocumentChunk,
  LineageGraph,
  AbstentionType,
  VisualExplanation,
  DocumentVersionDiff,
} from "@/lib/rag/types";
import { DocumentCollection } from "@/lib/business/audit-logger";
import { VisualAnswerRenderer } from "@/components/visualization/VisualAnswerRenderer";
import { EvidenceLens } from "@/components/evidence/EvidenceLens";
import { PaperUpload, UploadedPaper } from "@/components/ui/PaperUpload";

type BusinessTab = "qa" | "impact" | "audit" | "collections";

export default function BusinessWorkspacePage() {
  const [activeTab, setActiveTab] = useState<BusinessTab>("qa");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [collections, setCollections] = useState<DocumentCollection[]>([]);
  const [impactLinks, setImpactLinks] = useState<DocumentImpactLink[]>([]);
  const [loading, setLoading] = useState(false);

  // Business Q&A State
  const [query, setQuery] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);
  const [includeVisual, setIncludeVisual] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([
    "doc-clinical-v1",
    "doc-clinical-v2",
  ]);
  const [businessDocs, setBusinessDocs] = useState<UploadedPaper[]>([
    {
      documentId: "doc-clinical-v1",
      versionId: "ver-doc-clinical-v1-1",
      workspaceId: "demo-workspace",
      title: "Phase III Clinical Protocol v1 (Initial Mandate)",
      totalPages: 2,
      totalChunks: 2,
    },
    {
      documentId: "doc-clinical-v2",
      versionId: "ver-doc-clinical-v2-2",
      workspaceId: "demo-workspace",
      title: "Phase III Protocol Amendment v2 (Revised Guidelines)",
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

  const [answerData, setAnswerData] = useState<{
    answer: string;
    abstentionType: AbstentionType;
    claims: Claim[];
    retrievedChunks: DocumentChunk[];
    lineage: LineageGraph;
    visual: VisualExplanation | null;
  } | null>(null);

  // Version Comparison State
  const [versionDiff, setVersionDiff] = useState<DocumentVersionDiff | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const workspaceId = "demo-workspace";

  const fetchBusinessData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/audit?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.events) setAuditEvents(data.events);
      if (data.collections) setCollections(data.collections);
      if (data.impactLinks) setImpactLinks(data.impactLinks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunVersionDiff = async () => {
    setLoadingDiff(true);
    try {
      const res = await fetch("/api/documents/version-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: "doc-clinical-v1",
          versionA: 1,
          versionB: 2,
          workspaceId,
        }),
      });
      const data = await res.json();
      if (data.diff) setVersionDiff(data.diff);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDiff(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
    handleRunVersionDiff();
  }, []);

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

  const toggleDocSelection = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const needsReviewCount = impactLinks.filter((l) => l.status === "needs_review").length;

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#526A80] mb-1">
            <ShieldCheck className="w-4 h-4 text-[#17283B]" />
            <span>Enterprise Compliance & Governance</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#17283B]">
            Document Intelligence & Change Impact Audit
          </h1>
          <p className="text-xs text-[#526A80] mt-1 max-w-2xl">
            Extract action items, obligations, and deadlines; compare policy revisions; review downstream claim invalidations;
            and maintain immutable compliance audit trails.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-[#E8EEF2] p-1 rounded-lg text-xs font-semibold flex-wrap">
          <button
            onClick={() => setActiveTab("qa")}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === "qa" ? "bg-[#17283B] text-[#FFFFFF] shadow-sm" : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            Decisions & Q&A
          </button>
          <button
            onClick={() => setActiveTab("impact")}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === "impact" ? "bg-[#17283B] text-[#FFFFFF] shadow-sm" : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            Change Impact ({needsReviewCount})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === "audit" ? "bg-[#17283B] text-[#FFFFFF] shadow-sm" : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            Audit Trail ({auditEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("collections")}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === "collections" ? "bg-[#17283B] text-[#FFFFFF] shadow-sm" : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            Collections & Roles
          </button>
        </div>
      </div>

      {/* TAB 1: Business Decisions & Q&A */}
      {activeTab === "qa" && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-[#17283B]">
                  Business & Policy Document Inspection
                </h3>
                <p className="text-xs text-[#526A80] mt-0.5">
                  Query SOPs, clinical protocols, contracts, and internal audits with evidence-grounding.
                </p>
              </div>
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#17283B] hover:bg-[#223B56] text-white text-xs font-semibold rounded-md self-start sm:self-auto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Report / Policy</span>
              </button>
            </div>

            {showUpload && (
              <div className="pt-3 border-t border-[#E8EEF2]">
                <PaperUpload
                  workspaceId={workspaceId}
                  onUploadSuccess={(doc) => {
                    setBusinessDocs((prev) => [...prev, doc]);
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
              {businessDocs.map((doc) => {
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

            {/* Suggested Business Queries */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75808F] py-1">
                Business Prompts:
              </span>
              {[
                "Summarize the key findings of this report",
                "Visualize this process as a flowchart",
                "What decisions and action items are recorded?",
                "What obligations and deadlines are stated?",
                "Compare these policy versions in a table",
                "Which documents contain conflicting requirements?",
                "Show the evidence supporting this recommendation",
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

            {/* Question Input */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRunQA()}
                  placeholder="Ask a compliance, obligation, or decision question…"
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
                  {loadingQA ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                  <span>Analyze</span>
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
                      Evidence-Grounded Business Analysis
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
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Change Impact Analysis & Version Diff */}
      {activeTab === "impact" && (
        <div className="space-y-6">
          {/* Version Diff Section */}
          {versionDiff && (
            <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8EEF2] pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#347C70] mb-1">
                    <GitCommit className="w-4 h-4" />
                    <span>Version Comparison: v{versionDiff.versionA} vs v{versionDiff.versionB}</span>
                  </div>
                  <h3 className="font-editorial text-lg font-bold text-[#17283B]">
                    {versionDiff.docTitle}
                  </h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#FDF7ED] text-[#B98237] border border-[#B98237]/30 self-start sm:self-auto">
                  {versionDiff.affectedClaims.length} Downstream Claims Invalidated
                </span>
              </div>

              <div className="p-4 bg-[#FCFCF9] border border-[#D3DDE5] rounded-lg">
                <p className="text-xs text-[#252B33] leading-relaxed font-serif">
                  {versionDiff.summary}
                </p>
              </div>

              {/* Added, Removed, Modified Passages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-[#347C70]/30 rounded-lg bg-[#EBF5F3]/30 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#347C70]">
                    Added Passages (v{versionDiff.versionB})
                  </div>
                  {versionDiff.addedPassages.map((p, i) => (
                    <div key={i} className="text-xs text-[#252B33] border-l-2 border-[#347C70] pl-2 font-mono">
                      &ldquo;{p.text}&rdquo; (p. {p.page})
                    </div>
                  ))}
                </div>

                <div className="p-4 border border-[#B65353]/30 rounded-lg bg-[#FDF1F1]/30 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#B65353]">
                    Removed / Superseded Passages (v{versionDiff.versionA})
                  </div>
                  {versionDiff.removedPassages.map((p, i) => (
                    <div key={i} className="text-xs text-[#252B33] border-l-2 border-[#B65353] pl-2 font-mono line-through opacity-80">
                      &ldquo;{p.text}&rdquo; (p. {p.page})
                    </div>
                  ))}
                </div>
              </div>

              {/* Changed Numbers or Deadlines */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526A80]">
                  Material Parameter & Quantitative Changes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {versionDiff.changedNumbersOrDates.map((c, i) => (
                    <div key={i} className="p-3 border border-[#E8EEF2] rounded-lg bg-[#FCFCF9] text-xs space-y-1">
                      <div className="font-bold text-[#17283B]">{c.field}</div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="text-[#B65353] line-through">{c.from}</span>
                        <span>→</span>
                        <span className="text-[#347C70] font-bold">{c.to}</span>
                      </div>
                      <p className="text-[#526A80] text-[11px]">{c.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Claims Review Queue */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#B65353]">
                  Affected Downstream Answers (Review Required)
                </h4>
                <div className="space-y-2">
                  {versionDiff.affectedClaims.map((ac) => (
                    <div key={ac.claimId} className="p-3 border border-[#B65353]/20 rounded-lg bg-[#FDF1F1]/40 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-[#17283B]">&ldquo;{ac.claimText}&rdquo;</div>
                        <p className="text-[#526A80] mt-0.5">{ac.reason}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#B65353] text-white flex-shrink-0">
                        {ac.risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Impact Queue */}
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl shadow-editorial overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E8EEF2] flex items-center justify-between">
              <h3 className="font-editorial text-base font-bold text-[#17283B]">
                Registered Answer Impact Links ({impactLinks.length})
              </h3>
              <span className="text-xs text-[#526A80]">
                {needsReviewCount} flagged for re-verification
              </span>
            </div>

            <div className="divide-y divide-[#E8EEF2]">
              {impactLinks.map((link) => (
                <div key={link.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#FCFCF9] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-[#17283B]">{link.impactedTitle}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          link.status === "needs_review"
                            ? "bg-[#FDF7ED] text-[#B98237] border border-[#B98237]/30"
                            : "bg-[#EBF5F3] text-[#347C70]"
                        }`}
                      >
                        {link.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[#526A80]">{link.changeSummary}</p>
                  </div>
                  <div className="text-[10px] text-[#75808F] flex-shrink-0">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Audit Trail */}
      {activeTab === "audit" && (
        <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl shadow-editorial overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8EEF2] flex items-center justify-between">
            <h3 className="font-editorial text-base font-bold text-[#17283B]">
              Immutable Compliance Audit Logs ({auditEvents.length})
            </h3>
            <span className="text-xs text-[#526A80]">AES-256 Verified Storage</span>
          </div>

          <div className="divide-y divide-[#E8EEF2]">
            {auditEvents.map((event) => (
              <div key={event.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#FCFCF9] transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold text-[#17283B]">{event.action}</span>
                    <span className="text-[10px] text-[#75808F]">[{event.targetType}]</span>
                  </div>
                  {event.metadata && (
                    <div className="text-[11px] font-mono text-[#526A80]">
                      {JSON.stringify(event.metadata)}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-[#75808F]">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Collections & Permissions */}
      {activeTab === "collections" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {collections.map((col) => (
            <div key={col.id} className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#526A80]">
                  Collection
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8EEF2] text-[#17283B]">
                  Admin / Reviewer
                </span>
              </div>
              <h4 className="font-editorial text-base font-bold text-[#17283B]">{col.name}</h4>
              <p className="text-xs text-[#526A80] leading-relaxed">{col.description}</p>
              <div className="pt-2 border-t border-[#E8EEF2] flex items-center justify-between text-[11px] text-[#75808F]">
                <span>{col.documentIds.length} documents</span>
                <span className="text-[#347C70] font-semibold">RLS Enforced</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
