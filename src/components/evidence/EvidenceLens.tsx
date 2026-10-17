"use client";

import React, { useState } from "react";
import { Claim, ClaimStatus, Citation, DocumentChunk } from "@/lib/rag/types";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Edit3,
  FileText,
  UserCheck,
} from "lucide-react";

interface EvidenceLensProps {
  claims: Claim[];
  retrievedChunks: DocumentChunk[];
  onClaimStatusOverride?: (claimId: string, newStatus: ClaimStatus, notes: string) => void;
}

export function EvidenceLens({
  claims,
  retrievedChunks,
  onClaimStatusOverride,
}: EvidenceLensProps) {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(
    claims.length > 0 ? claims[0].id : ""
  );
  const [reviewModalClaim, setReviewModalClaim] = useState<Claim | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<ClaimStatus>("supported");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) || claims[0];

  const handleOpenReview = (claim: Claim) => {
    setReviewModalClaim(claim);
    setOverrideStatus(claim.status);
    setOverrideNotes(claim.reviewerNotes || "");
  };

  const handleSaveReview = async () => {
    if (!reviewModalClaim) return;
    setSubmittingReview(true);
    try {
      await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: reviewModalClaim.id,
          feedbackType: "status_override",
          correctedStatus: overrideStatus,
          notes: overrideNotes,
        }),
      });

      if (onClaimStatusOverride) {
        onClaimStatusOverride(reviewModalClaim.id, overrideStatus, overrideNotes);
      }
      setReviewModalClaim(null);
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!claims || claims.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-8 text-center text-[#526A80]">
        <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No claims available for inspection.</p>
        <p className="text-xs text-[#75808F] mt-1">Submit an inquiry to decompose and verify factual claims against indexed documents.</p>
      </div>
    );
  }

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case "supported":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#EBF5F3] text-[#347C70] border border-[#347C70]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supported</span>
          </span>
        );
      case "contradicted":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FDF1F1] text-[#B65353] border border-[#B65353]/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Contradicted</span>
          </span>
        );
      case "unresolved":
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-[#FDF7ED] text-[#B98237] border border-[#B98237]/30">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Unresolved</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg shadow-panel overflow-hidden">
      {/* Header bar */}
      <div className="bg-[#FCFCF9] border-b border-[#D3DDE5] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#347C70]"></div>
          <h3 className="font-editorial text-base font-bold text-[#17283B]">
            Evidence Lens™
          </h3>
          <span className="text-xs text-[#526A80] font-sans">
            — Claim-Level Source Verification
          </span>
        </div>
        <div className="text-xs text-[#75808F]">
          {claims.length} decomposed claim{claims.length !== 1 ? "s" : ""} inspected
        </div>
      </div>

      {/* Split inspection layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left Column: Claims Navigator */}
        <div className="lg:col-span-5 border-r border-[#D3DDE5] bg-[#F7F6F2]/40 p-4 space-y-2.5 overflow-y-auto max-h-[580px]">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#526A80] mb-2 px-1">
            Factual Claims Asserted
          </div>

          {claims.map((claim) => {
            const isSelected = claim.id === selectedClaim?.id;
            return (
              <div
                key={claim.id}
                onClick={() => setSelectedClaimId(claim.id)}
                className={`p-3.5 rounded-md border text-left cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#FFFFFF] border-[#17283B] shadow-sm ring-1 ring-[#17283B]/20"
                    : "bg-[#FFFFFF] border-[#D3DDE5] hover:border-[#526A80] hover:bg-[#FFFFFF]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#17283B]">
                    Claim #{claim.claimOrder}
                  </span>
                  {getStatusBadge(claim.status)}
                </div>

                <p className="text-xs text-[#252B33] font-medium leading-relaxed line-clamp-3">
                  {claim.claimText}
                </p>

                <div className="mt-2.5 pt-2 border-t border-[#E8EEF2] flex items-center justify-between text-[11px] text-[#526A80]">
                  <span>{claim.citations.length} cited passage{claim.citations.length !== 1 ? "s" : ""}</span>
                  <span className="text-[10px] font-mono text-[#75808F]">
                    {Math.round(claim.confidence * 100)}% conf
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Source Passage & Audit Trail Details */}
        <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[580px] bg-[#FFFFFF]">
          {selectedClaim ? (
            <div className="space-y-6">
              {/* Selected claim detail box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#526A80]">
                    Inspecting Claim #{selectedClaim.claimOrder}
                  </span>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedClaim.status)}
                    <button
                      onClick={() => handleOpenReview(selectedClaim)}
                      className="inline-flex items-center space-x-1 text-xs text-[#17283B] hover:text-[#325070] font-semibold border border-[#D3DDE5] px-2 py-0.5 rounded hover:bg-[#E8EEF2]/50 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Review / Override</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#FCFCF9] border border-[#D3DDE5] p-4 rounded-md">
                  <p className="text-sm font-serif text-[#17283B] leading-relaxed">
                    &ldquo;{selectedClaim.claimText}&rdquo;
                  </p>
                </div>
              </div>

              {/* Assessment Rationale */}
              {selectedClaim.assessment && (
                <div className="bg-[#E8EEF2]/40 border border-[#D3DDE5] rounded-md p-3.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#17283B] mb-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#526A80]" />
                    <span>Evaluation Rationale:</span>
                  </div>
                  <p className="text-xs text-[#4E5763] leading-relaxed">
                    {selectedClaim.assessment.rationale}
                  </p>
                </div>
              )}

              {/* Citations List with source quotes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526A80] mb-3">
                  Referenced Source Passages ({selectedClaim.citations.length})
                </h4>

                {selectedClaim.citations.length === 0 ? (
                  <div className="bg-[#FDF7ED] border border-[#B98237]/30 rounded-md p-4 text-xs text-[#B98237] flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Unsubstantiated Claim Warning</p>
                      <p className="mt-0.5 text-[#75808F]">
                        This statement lacks citations to any indexed document passage. It cannot be verified as true from workspace evidence.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedClaim.citations.map((citation, citIdx) => (
                      <div
                        key={citation.id}
                        className={`p-4 rounded-md border text-xs transition-colors ${
                          citation.isValidated
                            ? "bg-[#FCFCF9] border-[#D3DDE5]"
                            : "bg-[#FDF1F1]/50 border-[#B65353]/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-[#17283B] flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-[#526A80]" />
                            <span>
                              {citation.documentTitle || "Source Document"} — Page {citation.pageNumber || 1}
                            </span>
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              citation.isValidated
                                ? "bg-[#EBF5F3] text-[#347C70]"
                                : "bg-[#FDF1F1] text-[#B65353]"
                            }`}
                          >
                            {citation.isValidated ? "Verbatim Substring Match" : "Citation Mismatch"}
                          </span>
                        </div>

                        {/* The Exact Quote Highlight */}
                        <div className="bg-[#FFFFFF] border-l-2 border-[#17283B] p-2.5 my-2 text-xs text-[#252B33] italic leading-relaxed">
                          &ldquo;{citation.exactQuote}&rdquo;
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#75808F] mt-2">
                          <span>Chunk Ref: {citation.chunkId || "N/A"}</span>
                          <span>Relevance Score: {Math.round(citation.relevanceScore * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="pt-4 border-t border-[#E8EEF2] text-[11px] text-[#75808F] leading-normal">
                Notice: Automated evidence assessments are probabilistic evaluations and do not constitute legal or clinical proof of truth. Always inspect original primary source documents.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Human Review & Override Modal */}
      {reviewModalClaim && (
        <div className="fixed inset-0 z-50 bg-[#17283B]/50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg max-w-lg w-full p-6 shadow-modal">
            <h3 className="font-editorial text-lg font-bold text-[#17283B] mb-2">
              Human Review & Status Override
            </h3>
            <p className="text-xs text-[#526A80] mb-4">
              Override automated assessment for Claim #{reviewModalClaim.claimOrder}. Your decision will be permanently recorded in the audit trail.
            </p>

            <div className="bg-[#FCFCF9] border border-[#D3DDE5] p-3 rounded mb-4 text-xs italic text-[#252B33]">
              &ldquo;{reviewModalClaim.claimText}&rdquo;
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17283B] mb-1.5 uppercase">
                  Verified Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["supported", "unresolved", "contradicted"] as ClaimStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOverrideStatus(st)}
                      className={`py-2 px-3 text-xs font-semibold rounded border capitalize transition-colors ${
                        overrideStatus === st
                          ? "bg-[#17283B] text-[#FFFFFF] border-[#17283B]"
                          : "bg-[#FFFFFF] text-[#252B33] border-[#D3DDE5] hover:bg-[#F7F6F2]"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17283B] mb-1.5 uppercase">
                  Reviewer Notes & Justification
                </label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Explain why this claim status is being modified..."
                  rows={3}
                  className="w-full text-xs p-2.5 border border-[#D3DDE5] rounded focus:border-[#17283B] outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setReviewModalClaim(null)}
                className="px-3 py-1.5 text-xs text-[#526A80] hover:text-[#17283B] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={submittingReview}
                className="px-4 py-1.5 text-xs bg-[#17283B] hover:bg-[#223B56] text-[#FFFFFF] font-semibold rounded transition-colors"
              >
                {submittingReview ? "Recording..." : "Save Verification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
