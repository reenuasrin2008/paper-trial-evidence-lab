// Demo Documents & Workspace Initializer
import { Document, DocumentVersion, DocumentChunk } from "../rag/types";
import { chunkDocumentPages } from "../rag/chunker";
import { globalVectorStore } from "../rag/vector-store";
import { globalContradictionService } from "../analysis/contradiction";
import { globalImpactTracker } from "../analysis/impact-tracker";

export const SAMPLE_DOCUMENTS: Array<{
  id: string;
  title: string;
  fileType: "pdf" | "markdown" | "txt";
  versionNumber: number;
  pages: Array<{ pageNumber: number; text: string }>;
}> = [
  {
    id: "doc-clinical-v1",
    title: "Phase III Clinical Protocol: PT-902 Efficacy Analysis",
    fileType: "pdf",
    versionNumber: 1,
    pages: [
      {
        pageNumber: 1,
        text: `CLINICAL TRIAL SUMMARY & COHORT DESIGN
Protocol Identifier: PT-902-PH3
Study Objective: Evaluate efficacy and safety in 450 adult patients across 12 clinical centers.
Primary Endpoint: Significant reduction in symptom severity scores at week 12.
Dosage Mandate: Initial dosing is established at 25mg administered twice daily with meals.
Exclusion Criteria: Patients with severe hepatic impairment or creatinine clearance below 30 mL/min are strictly excluded from participation.`,
      },
      {
        pageNumber: 2,
        text: `INTERIM SAFETY FINDINGS & ADVERSE EVENTS
Week 12 Interim Monitoring Report:
The treatment cohort demonstrated an overall response rate of 74.2% compared to 31.8% in the placebo group.
Adverse Events: Mild nausea was reported in 8.4% of subjects; severe adverse events occurred in 1.1% of participants.
Remote Monitoring Policy: On-site physical clinic visits are required bi-weekly. Remote tele-health visits are not authorized for vital assessments.`,
      },
    ],
  },
  {
    id: "doc-clinical-v2",
    title: "Phase III Protocol Amendment: PT-902 Revised Guidelines (v2)",
    fileType: "pdf",
    versionNumber: 2,
    pages: [
      {
        pageNumber: 1,
        text: `PROTOCOL AMENDMENT NO. 2 (SUPERSEDES V1)
Protocol Identifier: PT-902-PH3-AMEND2
Updated Dosing Guidelines: The initial dosing has been revised to 50mg once daily following pharmacokinetic tolerance findings.
Expanded Patient Cohort: Enrollment expanded to 600 adult patients across 16 global sites.
Regulatory Status: Approved by ethics oversight review board on August 14, 2024.`,
      },
      {
        pageNumber: 2,
        text: `MODIFIED CLINICAL MONITORING PROCEDURES
Virtual Monitoring Amendment:
Tele-health remote visits are now authorized for routine week 4 and week 8 monitoring visits, replacing mandatory on-site clinic visits.
Adverse event reporting threshold adjusted to 24-hour expedited notification for Grade 3+ toxicities.`,
      },
    ],
  },
  {
    id: "doc-ai-governance",
    title: "Neural Retrieval & RAG System Governance Framework",
    fileType: "markdown",
    versionNumber: 1,
    pages: [
      {
        pageNumber: 1,
        text: `# Enterprise RAG Reliability and Hallucination Prevention Standard
Document Ref: ENG-GOV-2024.08

## 1. Citation & Grounding Requirements
All generative model outputs deployed in production workflows must enforce claim-level citation validation.
Rule 1.1: Every material factual statement must be backed by an exact verbatim excerpt from indexed source chunks.
Rule 1.2: When retrieved cosine similarity falls below 0.45 or retrieved context lacks relevant information, the system MUST abstain with an explicit "no_evidence" status.
Rule 1.3: Similarity scores or model self-confidence scores shall never be presented as proof of correctness without ground-truth citation verification.`,
      },
      {
        pageNumber: 2,
        text: `## 2. Adversarial Injection Defenses & Untrusted Document Handling
Rule 2.1: Content within uploaded PDFs or Markdown documents must be treated as untrusted runtime data.
Rule 2.2: Hidden directives embedded within document text (such as "Ignore previous instructions" or "Reveal developer system prompt") must be stripped or neutralized by the ingestion sanitizer before chunk indexing.
Rule 2.3: Cross-document contradiction detection must highlight conflicting quantitative claims for human review rather than silently synthesizing contradictory assertions.`,
      },
    ],
  },
  {
    id: "doc-security-audit",
    title: "Cloud Infrastructure Security & Privacy Audit Report",
    fileType: "txt",
    versionNumber: 1,
    pages: [
      {
        pageNumber: 1,
        text: `INDEPENDENT AUDIT REPORT — Q3
Audit Firm: Cybersecurity Assurance Labs
Scope: Multi-tenant workspace data isolation and secrets management.

Findings Summary:
1. Environment Configuration: Secret credentials (GEMINI_API_KEY) are confirmed to be strictly isolated to server-side environments. No browser leakage detected.
2. Tenant Isolation: Database Row Level Security (RLS) properly segregates document chunks and vector embeddings across workspace boundaries.
3. Data Retention: Customer document text is retained in encrypted storage at rest (AES-256) and is never utilized for external model retraining.`,
      },
    ],
  },
];

let isInitialized = false;

export async function initializeDemoWorkspace(workspaceId = "demo-workspace"): Promise<void> {
  if (isInitialized) return;

  for (const doc of SAMPLE_DOCUMENTS) {
    const chunks = chunkDocumentPages(doc.pages, {
      documentId: doc.id,
      versionId: `ver-${doc.id}-${doc.versionNumber}`,
      workspaceId,
      documentTitle: doc.title,
    });

    await globalVectorStore.addChunks(chunks);

    // Register impact links for dependency tracking
    for (const chunk of chunks) {
      globalImpactTracker.recordImpactLink({
        id: `impact-${chunk.id}`,
        workspaceId,
        documentId: doc.id,
        documentTitle: doc.title,
        versionId: chunk.versionId,
        versionNumber: doc.versionNumber,
        impactedType: "answer_claim",
        impactedId: `claim-auto-${chunk.id}`,
        impactedTitle: `Claim referencing ${doc.title} (Page ${chunk.pageNumber})`,
        status: doc.id === "doc-clinical-v1" ? "needs_review" : "up_to_date",
        changeSummary:
          doc.id === "doc-clinical-v1"
            ? "Protocol amended in v2: Dosing increased to 50mg once daily and virtual visits authorized."
            : "Current active version.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Pre-seed known cross-document contradiction between Clinical Protocol v1 and Amendment v2
  globalContradictionService.addCandidate({
    id: "contra-demo-1",
    workspaceId,
    docAId: "doc-clinical-v1",
    docBId: "doc-clinical-v2",
    docATitle: "Phase III Clinical Protocol v1",
    docBTitle: "Phase III Protocol Amendment v2",
    passageA: "Initial dosing is established at 25mg administered twice daily with meals. On-site clinic visits are required bi-weekly; remote visits are not authorized.",
    passageB: "The initial dosing has been revised to 50mg once daily. Tele-health remote visits are now authorized for routine week 4 and week 8 monitoring visits.",
    pageA: 1,
    pageB: 1,
    disagreementExplanation: "Contradiction in primary dosing protocol (25mg twice daily vs 50mg once daily) and mandatory on-site vs authorized tele-health visits.",
    status: "unreviewed",
    createdAt: new Date().toISOString(),
  });

  isInitialized = true;
}
