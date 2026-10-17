# PaperTrail Evidence Lab
### Evidence-First Document Intelligence & RAG Reliability Platform

> **"Every important answer must be traceable to its source evidence."**

PaperTrail Evidence Lab is a professional document intelligence platform designed to eliminate the illusion of AI confidence. It decomposes answers into atomic factual claims, verifies exact-quote citations against underlying document passages, flags citation mismatches, analyzes cross-document contradictions, and triggers explicit answer abstention when evidence is missing or conflicting.

---

## 1. Editorial Research Visual Language

PaperTrail rejects generic AI dashboard tropes (neon outlines, glowing orbs, decorative neural networks, oversized chat bubbles). Instead, it adopts a refined editorial design inspired by analytical publishing, clinical research platforms, and judicial evidence archives:

| Semantic Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Deep Ink Navy** | `#17283B` | Primary headers, active navigation, focused lineage nodes |
| **Muted Slate Blue** | `#526A80` | Subtitles, secondary chrome, inactive tabs |
| **Warm Off-White** | `#F7F6F2` | Workspace background, body canvas |
| **Pure White** | `#FFFFFF` | Card surfaces, modals, passage highlight boxes |
| **Pale Blue-Grey** | `#E8EEF2` | Subtle borders, table headers, node links |
| **Graphite Text** | `#252B33` | Primary body typography and claim content |
| **Restrained Teal** | `#347C70` | Verified & supported status badges |
| **Muted Amber** | `#B98237` | Unresolved claims & contradiction warnings |
| **Muted Crimson** | `#B65353` | Contradicted claims & citation mismatch errors |

---

## 2. Architectural Overview

```
                                  +------------------------------------+
                                  |    Next.js 14 App Router (React)   |
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
             +-----------v------------+                            +-----------v------------+
             |   Student Workspace    |                            | Developer Regression   |
             | - Grounded Research Q&A|                            | - Query Trace Explorer |
             | - Study Guide Generator|                            | - Experiment Runs      |
             | - Source-Linked Quiz   |                            | - Stress Suite         |
             +------------------------+                            +------------------------+
                         |                                                     |
                         +--------------------------+--------------------------+
                                                    |
                                  +-----------------v------------------+
                                  |        Business & Compliance       |
                                  | - Change Impact Dependencies       |
                                  | - Privacy-Safe Audit Trail         |
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
             +-----------v------------+                            +-----------v------------+
             |     Evidence Lens™     |                            | Evidence Lineage Graph |
             | - Claim Decomposition  |                            | - Question -> Chunks   |
             | - Quote Verification   |                            | - Synthesis -> Claims  |
             | - Human Override Modal |                            | - Accessible Table     |
             +------------------------+                            +------------------------+
                                                    |
                                  +-----------------v------------------+
                                  |       Core RAG & Safety Engine     |
                                  | - Prompt Injection Sanitizer       |
                                  | - Boundary-Preserving Chunker      |
                                  | - Vector Cosine Search (pgvector)  |
                                  | - Gemini 3.8 Flash & Embeddings    |
                                  | - Document Version Impact Tracker  |
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
             +-----------v------------+                            +-----------v------------+
             |   Supabase PostgreSQL  |                            | Google Gemini 3.8      |
             | - Versioned Migrations |                            | - Server-Side Provider |
             | - Row Level Security   |                            | - Structured JSON      |
             +------------------------+                            +------------------------+
```

---

## 3. Signature Features

### 1. Evidence Lens™ (Claim-Level Source Verification)
- Decomposes generated answers into individual atomic factual statements.
- Compares claimed citations against indexed source chunks to verify verbatim substring authenticity.
- Distinguishes **Supported** (exact passage found), **Contradicted** (passage proves opposite), and **Unresolved** (citation mismatch or no quote).
- Provides an interactive split view: selecting any claim immediately highlights its source document and page number.
- Allows authorized reviewers to override automated assessments with justification notes preserved in the audit log.

### 2. Evidence Lineage Graph & Accessible Table
- Maps end-to-end evidence lineage:
  `User Inquiry` $\rightarrow$ `Retrieved Chunks` $\rightarrow$ `Synthesis` $\rightarrow$ `Asserted Claims` $\rightarrow$ `Verifiable Citations` $\rightarrow$ `Evidence Assessment`.
- Supports interactive node highlighting to reveal upstream evidence dependencies.
- Offers an accessible tabular view for screen-reader and keyboard compliance.

### 3. Contradiction & Change Impact Analysis
- Detects factual disagreements between document versions (e.g., Clinical Protocol v1 requiring 25mg twice daily vs Protocol Amendment v2 specifying 50mg once daily).
- Provides a side-by-side passage comparison review drawer for human confirmation.
- Tracks downstream answers, student notes, and evaluation cases, automatically flagging them as `needs_review` when a supporting document is amended.

### 4. Developer Regression Lab & Adversarial Stress Tests
- Executes automated regression benchmarks across configurable parameters (top-k, similarity threshold, chunk size, model).
- Computes standard metrics:
  - **Retrieval Precision & Recall**
  - **Citation Verbatim Correctness**
  - **Evidence Support Rate**
  - **Abstention Decision Accuracy**
  - **Average Query Latency (ms)**
- Provides side-by-side experiment run comparisons.
- Features pre-packaged adversarial stress tests (unanswerable questions, prompt injections in documents, citation mismatches, multi-hop synthesis).

### 5. Multi-Format Evidence Audit Export
- One-click export of complete evidence audit packages in **JSON**, **CSV**, or standalone styled **HTML** suitable for compliance archiving and printing.

---

## 4. Quick Start & Local Development

### Prerequisites
- Node.js v20+
- npm v10+

### Step 1: Clone & Install Dependencies
```bash
git clone <repo-url>
cd paper-trial-evidence-lab
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local` and populate your credentials:
```bash
cp .env.example .env.local
```

Inside `.env.local`:
```env
# Supabase Configuration (Client-safe)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_publishable_key

# Google Gemini API Configuration (Server-side privileged only)
GEMINI_API_KEY=your_gemini_api_key
```

> **Security Verification:** `.env.local` is strictly excluded in `.gitignore`. Privileged secrets like `GEMINI_API_KEY` are enforced as server-side only in `src/lib/config/env.ts` and will throw runtime exceptions if accessed in browser code.

### Step 3: Run the Application
```bash
# Start Next.js in production mode
npm run build
npm start

# Or start in local development mode
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Automated Tests & Verification

Run the full automated test suite using Vitest:
```bash
npm test
```

### Verified Test Suite (15 Tests Passing Across 8 Suites):
- `tests/chunker.test.ts` — Boundary-preserving chunking, page numbers, overlap, and token counts.
- `tests/sanitizer.test.ts` — Neutralization of prompt injections (`ignore previous instructions`, etc.).
- `tests/citation-validator.test.ts` — Verbatim quote verification and citation mismatch detection.
- `tests/evidence-lens.test.ts` — Claim extraction, citation validation against chunks, and support rate calculation.
- `tests/lineage.test.ts` — Evidence Lineage Graph node and edge generation.
- `tests/contradiction.test.ts` — Polar conflict detection across documents and human review transitions.
- `tests/impact-tracker.test.ts` — Downstream dependency tracking on updated document versions.
- `tests/workspace-isolation.test.ts` — Multi-tenant workspace data isolation and vector filtering.

---

## 6. Database Migrations (Supabase / PostgreSQL)

Versioned migrations are located in `supabase/migrations/`:
1. `00001_initial_schema_and_extensions.sql` — Enables `uuid-ossp`, `pgcrypto`, and `vector` (pgvector).
2. `00002_profiles_workspaces_memberships.sql` — User profiles, workspaces, and role memberships.
3. `00003_documents_versions_chunks.sql` — Document versions, chunks, and similarity search RPC `match_document_chunks`.
4. `00004_conversations_claims_citations.sql` — Conversations, messages, claims, citations, and evidence assessments.
5. `00005_contradictions_and_impact.sql` — Contradiction candidates and document impact dependency links.
6. `00006_evaluations_experiments_stress.sql` — Eval datasets, test cases, regression runs, and student notes.
7. `00007_audit_and_feedback.sql` — Document collections, privacy-safe audit logging, and human feedback.
8. `00008_rls_policies.sql` — Comprehensive Row Level Security (RLS) enforcing workspace data isolation.

### Applying Migrations via Supabase Dashboard
A consolidated script containing the full schema is prepared at:
`supabase/full_schema.sql`

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** $\rightarrow$ **New Query**.
3. Paste the contents of [`supabase/full_schema.sql`](file:///Users/reenuasrin/cse%20projects/paper-trial-evidence-lab/supabase/full_schema.sql) and click **Run**.
4. Enable the **Vector** extension under **Database** $\rightarrow$ **Extensions** if not already enabled.

---

## 7. Vercel Deployment

The project is structured for zero-config Vercel deployment:
1. Connect your GitHub repository to Vercel.
2. In Project Settings $\rightarrow$ Environment Variables, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GEMINI_API_KEY`
3. Deploy! Next.js will build the static pages and deploy the API route handlers as serverless functions.
