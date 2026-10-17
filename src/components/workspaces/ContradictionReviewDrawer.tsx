"use client";

import React, { useState, useEffect } from "react";
import { ContradictionCandidate } from "@/lib/rag/types";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  FileText,
  UserCheck,
} from "lucide-react";

export function ContradictionReviewDrawer() {
  const [candidates, setCandidates] = useState<ContradictionCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ContradictionCandidate | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contradictions?workspaceId=demo-workspace");
      const data = await res.json();
      if (data.candidates) {
        setCandidates(data.candidates);
        if (data.candidates.length > 0 && !selectedCandidate) {
          setSelectedCandidate(data.candidates[0]);
        }
      }
    } catch (err) {
      console.error("Error loading contradictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleReviewAction = async (status: "confirmed_contradiction" | "rejected_compatible" | "unresolved") => {
    if (!selectedCandidate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contradictions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          status,
          reviewerName: "Principal Lead Reviewer",
          notes: reviewerNotes,
        }),
      });
      const data = await res.json();
      if (data.success && data.candidate) {
        setSelectedCandidate(data.candidate);
        setCandidates((prev) =>
          prev.map((c) => (c.id === data.candidate.id ? data.candidate : c))
        );
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (candidates.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg shadow-editorial overflow-hidden my-6">
      <div className="bg-[#FCFCF9] border-b border-[#D3DDE5] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#B98237]" />
          <h3 className="font-editorial text-base font-bold text-[#17283B]">
            Contradiction & Disagreement Analysis
          </h3>
          <span className="text-xs text-[#526A80] font-sans">
            — Cross-Document Conflict Verification
          </span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#FDF7ED] text-[#B98237] border border-[#B98237]/30">
          {candidates.length} Candidate Flagged
        </span>
      </div>

      <div className="p-6">
        {selectedCandidate && (
          <div className="space-y-6">
            <div className="bg-[#FDF7ED] border border-[#B98237]/30 rounded-md p-3.5 text-xs text-[#252B33]">
              <span className="font-bold text-[#B98237] uppercase tracking-wide mr-2">
                Potential Conflict:
              </span>
              {selectedCandidate.disagreementExplanation}
            </div>

            {/* Side-by-side passage comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passage A */}
              <div className="border border-[#D3DDE5] rounded-md p-4 bg-[#FCFCF9]">
                <div className="flex items-center justify-between text-xs font-bold text-[#17283B] mb-2 pb-2 border-b border-[#E8EEF2]">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#526A80]" />
                    <span>{selectedCandidate.docATitle}</span>
                  </span>
                  <span className="text-[11px] text-[#75808F]">Page {selectedCandidate.pageA}</span>
                </div>
                <p className="text-xs text-[#252B33] italic leading-relaxed">
                  &ldquo;{selectedCandidate.passageA}&rdquo;
                </p>
              </div>

              {/* Passage B */}
              <div className="border border-[#D3DDE5] rounded-md p-4 bg-[#FCFCF9]">
                <div className="flex items-center justify-between text-xs font-bold text-[#17283B] mb-2 pb-2 border-b border-[#E8EEF2]">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#526A80]" />
                    <span>{selectedCandidate.docBTitle}</span>
                  </span>
                  <span className="text-[11px] text-[#75808F]">Page {selectedCandidate.pageB}</span>
                </div>
                <p className="text-xs text-[#252B33] italic leading-relaxed">
                  &ldquo;{selectedCandidate.passageB}&rdquo;
                </p>
              </div>
            </div>

            {/* Current Review Decision */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D3DDE5]">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-[#526A80]">Review Decision:</span>
                <span className="font-semibold text-[#17283B] uppercase px-2 py-0.5 rounded bg-[#E8EEF2]">
                  {selectedCandidate.status.replace("_", " ")}
                </span>
                {selectedCandidate.reviewedBy && (
                  <span className="text-[#75808F]">
                    by {selectedCandidate.reviewedBy} on{" "}
                    {new Date(selectedCandidate.reviewedAt || "").toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleReviewAction("confirmed_contradiction")}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs bg-[#B65353] hover:bg-[#8F3E3E] text-[#FFFFFF] font-semibold rounded flex items-center space-x-1 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Contradiction</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewAction("rejected_compatible")}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs bg-[#347C70] hover:bg-[#275E55] text-[#FFFFFF] font-semibold rounded flex items-center space-x-1 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark Compatible (v2 Supersedes)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
