"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  BookOpen,
  Terminal,
  Sparkles,
  RefreshCw,
  GitBranch,
  Upload,
  ChevronRight,
  Microscope,
} from "lucide-react";
import { PaperUpload, UploadedPaper } from "@/components/ui/PaperUpload";

export default function LandingPage() {
  const router = useRouter();
  const [uploadedPaper, setUploadedPaper] = useState<UploadedPaper | null>(null);

  const handleUploadSuccess = (paper: UploadedPaper) => {
    setUploadedPaper(paper);
    // Store the paper context for the student workspace
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lastUploadedPaper", JSON.stringify(paper));
    }
    // Navigate to student workspace
    setTimeout(() => {
      router.push("/workspace/student");
    }, 1200);
  };

  return (
    <div className="space-y-16">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto pt-6 pb-2 space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E8EEF2] border border-[#D3DDE5] text-xs font-semibold text-[#17283B]">
          <span className="w-2 h-2 rounded-full bg-[#347C70]" />
          <span>Evidence-First Research Paper Intelligence</span>
        </div>

        <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold text-[#17283B] leading-[1.15] tracking-tight">
          Upload a paper.<br />
          <span className="text-[#347C70]">Trace every claim</span> to its source.
        </h1>

        <p className="text-base sm:text-lg text-[#526A80] max-w-2xl mx-auto leading-relaxed">
          PaperTrail indexes your research papers and answers your questions with exact passage
          citations. Every answer is grounded in the text — nothing is fabricated.
        </p>

        {/* Primary Upload CTA */}
        <div className="max-w-xl mx-auto">
          {uploadedPaper ? (
            <div className="bg-[#EBF5F3] border border-[#347C70]/40 rounded-xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#347C70] mx-auto" />
              <div>
                <p className="font-semibold text-[#17283B] text-sm">&ldquo;{uploadedPaper.title}&rdquo; indexed</p>
                <p className="text-xs text-[#526A80] mt-1">
                  {uploadedPaper.totalChunks} passages ready · Redirecting to Research Lab…
                </p>
              </div>
              <div className="flex justify-center">
                <RefreshCw className="w-4 h-4 text-[#347C70] animate-spin" />
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-4">
              <PaperUpload
                workspaceId="demo-workspace"
                onUploadSuccess={handleUploadSuccess}
              />
              <div className="text-center">
                <NextLink
                  href="/workspace/student"
                  className="text-xs text-[#526A80] hover:text-[#17283B] underline underline-offset-2"
                >
                  Or try with demo documents →
                </NextLink>
              </div>
            </div>
          )}
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#526A80]">
          {[
            "Exact passage citations",
            "Structured paper overview",
            "Claim verification",
            "Multi-paper comparison",
            "Study guide & quiz",
          ].map((f) => (
            <span key={f} className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F7F6F2] border border-[#D3DDE5]">
              <CheckCircle2 className="w-3 h-3 text-[#347C70]" />
              <span>{f}</span>
            </span>
          ))}
        </div>
      </section>

      {/* 2. Visual Contrast: Illusion of Confidence vs Evidence */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FCFCF9] border border-[#D3DDE5] rounded-xl p-6 sm:p-8 shadow-editorial">
        <div className="border-r border-[#D3DDE5]/60 pr-0 md:pr-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#B65353]">
            <XCircle className="w-4 h-4" />
            <span>Standard AI — The Illusion of Confidence</span>
          </div>
          <div className="bg-[#FDF1F1]/40 border border-[#B65353]/20 rounded-lg p-4 text-xs text-[#252B33] space-y-2.5">
            <p className="font-serif italic text-sm text-[#17283B]">
              &ldquo;The study achieved 98.4% efficacy with 450 subjects and remote monitoring is fully authorized.&rdquo;
            </p>
            <div className="pt-2 border-t border-[#B65353]/20 text-[11px] text-[#B65353] space-y-1">
              <div>⚠ Fabricated metric: Actual paper states 74.2% response rate.</div>
              <div>⚠ Ignored conflict: Remote visits were forbidden in v1.</div>
              <div>⚠ No exact quote exists in the source text.</div>
            </div>
          </div>
          <p className="text-xs text-[#526A80] leading-relaxed">
            Standard chatbots generate plausible prose without proving statements — critical risk in
            research, clinical, and legal contexts.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#347C70]">
            <CheckCircle2 className="w-4 h-4" />
            <span>PaperTrail — Verifiable Evidence Engine</span>
          </div>
          <div className="bg-[#EBF5F3]/50 border border-[#347C70]/30 rounded-lg p-4 text-xs text-[#252B33] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#347C70]">
              <span>Claim Decomposition & Exact Quote Matching</span>
              <span className="bg-[#347C70] text-[#FFFFFF] px-1.5 py-0.5 rounded text-[10px]">100% Verified</span>
            </div>
            <p className="font-serif text-sm text-[#17283B]">
              &ldquo;The treatment cohort demonstrated an overall response rate of 74.2%…&rdquo;
            </p>
            <div className="text-[11px] font-mono text-[#526A80] bg-[#FFFFFF] p-2 rounded border border-[#D3DDE5]">
              Source: Protocol v1 (Page 2, Chunk #2) — Verbatim Substring Validated
            </div>
          </div>
          <p className="text-xs text-[#526A80] leading-relaxed">
            PaperTrail decomposes answers into atomic claims, verifies exact quote substrings, flags
            citation mismatches, and abstains when evidence is missing.
          </p>
        </div>
      </section>

      {/* 3. Three-step how it works */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-editorial text-2xl font-bold text-[#17283B]">
            How PaperTrail works
          </h2>
          <p className="text-xs text-[#526A80] mt-1">
            From PDF to evidence-grounded answers in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              icon: Upload,
              title: "Upload your paper",
              desc: "Drag & drop any research PDF. PaperTrail extracts text, preserves page structure, and indexes every passage with embeddings.",
              color: "bg-[#E8EEF2]",
              iconColor: "text-[#17283B]",
            },
            {
              step: "02",
              icon: Search,
              title: "Ask questions",
              desc: "Ask anything in natural language — findings, methodology, limitations, comparisons. PaperTrail retrieves the most relevant passages.",
              color: "bg-[#EBF5F3]",
              iconColor: "text-[#347C70]",
            },
            {
              step: "03",
              icon: CheckCircle2,
              title: "Inspect evidence",
              desc: "Every claim in the answer is linked to an exact verbatim quote with a page number. Unsupported claims are flagged immediately.",
              color: "bg-[#FDF7ED]",
              iconColor: "text-[#B98237]",
            },
          ].map(({ step, icon: Icon, title, desc, color, iconColor }) => (
            <div
              key={step}
              className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial space-y-4 hover:border-[#17283B] transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded ${color} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <span className="font-editorial text-3xl font-bold text-[#E8EEF2] select-none">
                  {step}
                </span>
              </div>
              <h3 className="font-editorial text-lg font-bold text-[#17283B]">{title}</h3>
              <p className="text-xs text-[#526A80] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Audience Workspaces */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-editorial text-2xl font-bold text-[#17283B]">
            Four Dedicated Workspaces. One Verifiable Evidence Engine.
          </h2>
          <p className="text-xs text-[#526A80] mt-1">
            Purpose-built workflows for students, RAG engineers, academic researchers, and enterprise compliance teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: BookOpen,
              href: "/workspace/student",
              title: "Student Learning",
              desc: "Textbooks & lecture notes with simplified explanations, concept maps, flashcards, and page-cited quizzes.",
              cta: "Open Student Lab",
              badge: "Learn",
            },
            {
              icon: Terminal,
              href: "/workspace/developer",
              title: "Developer Systems",
              desc: "Architecture extraction, API flowcharts, system specs, RAG regression benchmarking, and stress suites.",
              cta: "Open Dev Lab",
              badge: "Engineer",
            },
            {
              icon: Microscope,
              href: "/workspace/researcher",
              title: "Academic Research",
              desc: "Multi-paper meta-analysis, methodology flowcharts, reproducibility audits, and real OpenAlex scholarly discovery.",
              cta: "Open Research Lab",
              badge: "Research",
            },
            {
              icon: ShieldCheck,
              href: "/workspace/business",
              title: "Business Compliance",
              desc: "Policy comparison, downstream change impact review, contract obligations, and immutable audit logs.",
              cta: "Open Business Lab",
              badge: "Governance",
            },
          ].map(({ icon: Icon, href, title, desc, cta, badge }) => (
            <div
              key={href}
              className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-5 shadow-editorial space-y-4 transition-all hover:border-[#17283B] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[#17283B] text-white flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8EEF2] text-[#526A80]">
                    {badge}
                  </span>
                </div>
                <h3 className="font-editorial text-base font-bold text-[#17283B]">{title}</h3>
                <p className="text-xs text-[#526A80] leading-relaxed">{desc}</p>
              </div>

              <NextLink
                href={href}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#17283B] hover:text-[#347C70] pt-2 border-t border-[#E8EEF2]"
              >
                <span>{cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NextLink>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
