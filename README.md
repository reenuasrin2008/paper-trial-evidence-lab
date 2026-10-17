<div align="center">

# PaperTrail Evidence Lab

### Evidence-First Document Intelligence & RAG Reliability Platform

> **"Every important answer must be traceable to its source evidence."**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL+pgvector-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.8_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-15_passing-2DA44E?logo=checkmarx&logoColor=white)]()

**PaperTrail Evidence Lab** is a professional document-intelligence platform engineered to **eliminate the illusion of AI confidence**. It decomposes generated answers into atomic factual claims, verifies exact-quote citations against underlying document passages, flags citation mismatches, analyzes cross-document contradictions, and triggers explicit answer **abstention** when evidence is missing or conflicting.

</div>

---

## Table of Contents

1. [Why PaperTrail?](#1-why-papertrail)
2. [Core Capabilities at a Glance](#2-core-capabilities-at-a-glance)
3. [System Architecture](#3-system-architecture)
4. [Evidence Lens™ — Claim-Level Verification Pipeline](#4-evidence-lens-claim-level-verification-pipeline)
5. [Evidence Lineage Graph](#5-evidence-lineage-graph)
6. [Contradiction & Change-Impact Analysis](#6-contradiction--change-impact-analysis)
7. [Developer Regression Lab & Adversarial Stress Tests](#7-developer-regression-lab--adversarial-stress-tests)
8. [End-to-End Request Lifecycle](#8-end-to-end-request-lifecycle)
9. [Database Schema (ERD)](#9-database-schema-erd)
10. [Security & Multi-Tenancy Model](#10-security--multi-tenancy-model)
11. [Editorial Design Language](#11-editorial-design-language)
12. [Project Structure](#12-project-structure)
13. [Quick Start](#13-quick-start)
14. [Automated Tests](#14-automated-tests)
15. [Database Migrations](#15-database-migrations)
16. [Deployment](#16-deployment)
17. [Roadmap](#17-roadmap)
18. [Contributing](#18-contributing)
19. [License](#19-license)

---

## 1. Why PaperTrail?

Modern RAG systems are remarkably confident — and remarkably unverifiable. They surface fluent answers with citations that *look* authoritative but often **paraphrase, fabricate, or contradict** the very source they claim to quote. In regulated domains — clinical research, legal evidence, judicial archives, compliance audits — that gap is unacceptable.

PaperTrail closes it by treating **every answer as a chain of evidence** rather than a single text blob.

```mermaid
flowchart LR
    classDef problem fill:#FBE9E7,stroke:#B65353,stroke-width:2px,color:#252B33
    classDef solution fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#252B33
    classDef outcome fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#252B33

    subgraph P["The Illusion of AI Confidence"]
        direction TB
        Q["User Question"]:::problem --> LLM["LLM Generates Answer"]:::problem
        LLM --> C["Cited Sources<br/>May be paraphrased,<br/>missing, or wrong"]:::problem
        C --> U["User trusts<br/>unsupported claim"]:::problem
    end

    subgraph S["PaperTrail's Evidence-First Approach"]
        direction TB
        Q2["User Question"]:::solution --> RAG["Retrieval + Synthesis"]:::solution
        RAG --> CD["Claim Decomposition"]:::solution
        CD --> V{"Verbatim Quote<br/>Verification"}:::solution
        V -->|Supported| OK["Allow Answer"]:::solution
        V -->|Contradicted| FLAG["Flag + Show Conflict"]:::solution
        V -->|Unresolved| ABS["Abstain Explicitly"]:::solution
    end

    P -.replaced by.-> S

    OK --> O1["Auditable<br/>Trustworthy<br/>Compliance-Ready"]:::outcome
    FLAG --> O2["Reviewer Override<br/>with Justification"]:::outcome
    ABS --> O3["Honest 'I don't know'<br/>with documented reason"]:::outcome
```

The result is a research platform where **every important answer can be traced back to its exact passage** — verifiable, auditable, and aligned with the editorial discipline of clinical research publishing and judicial evidence archives.

---

## 2. Core Capabilities at a Glance

| # | Capability | What it does | Primary user |
|---|-----------|--------------|--------------|
| 1 | **Evidence Lens™** | Decomposes answers into atomic claims; verifies each citation against indexed passages | Student / Reviewer |
| 2 | **Evidence Lineage Graph** | Visualizes the full chain: inquiry → chunks → synthesis → claims → citations → assessment | Reviewer / Auditor |
| 3 | **Contradiction & Change Impact** | Detects factual conflicts across document versions; flags downstream dependencies as `needs_review` | Compliance / Editor |
| 4 | **Developer Regression Lab** | Automated benchmarks + adversarial stress tests across retrieval parameters | Developer / ML Engineer |
| 5 | **Multi-Format Audit Export** | One-click JSON / CSV / styled HTML export of the complete evidence audit package | Compliance / Auditor |

---

## 3. System Architecture

PaperTrail is layered as a **vertical stack**: presentation and workspaces on top, evidence-aware intelligence in the middle, a hardened RAG core below, and external data providers at the base.

```mermaid
flowchart TB
    classDef ui fill:#FFFFFF,stroke:#526A80,stroke-width:2px,color:#17283B
    classDef evidence fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#252B33
    classDef core fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#252B33
    classDef data fill:#E8EEF2,stroke:#17283B,stroke-width:2px,color:#17283B

    subgraph UI["Presentation & Workspaces — Next.js 14 App Router (React 18)"]
        SW["Student Workspace<br/>• Grounded Research Q&A<br/>• Study Guide Generator<br/>• Source-Linked Quiz"]:::ui
        DL["Developer Regression Lab<br/>• Query Trace Explorer<br/>• Experiment Runs<br/>• Stress Suite"]:::ui
        BC["Business & Compliance<br/>• Change-Impact Dependencies<br/>• Privacy-Safe Audit Trail"]:::ui
    end

    subgraph EV["Evidence Intelligence Layer"]
        EL["Evidence Lens™<br/>• Claim Decomposition<br/>• Quote Verification<br/>• Human Override Modal"]:::evidence
        LG["Evidence Lineage Graph<br/>• Question → Chunks<br/>• Synthesis → Claims<br/>• Accessible Table View"]:::evidence
        CI["Contradiction & Impact<br/>• Cross-Version Diff<br/>• Side-by-Side Review<br/>• Downstream Flagging"]:::evidence
    end

    subgraph CORE["Core RAG & Safety Engine"]
        PS["Prompt-Injection Sanitizer"]:::core
        CK["Boundary-Preserving Chunker"]:::core
        VS["Vector Cosine Search<br/>(pgvector)"]:::core
        GE["Gemini 3.8 Flash<br/>+ Embeddings"]:::core
        IT["Document Version<br/>Impact Tracker"]:::core
    end

    subgraph DATA["External Data Providers"]
        SB["Supabase PostgreSQL<br/>• Versioned Migrations<br/>• Row-Level Security"]:::data
        GM["Google Gemini 3.8<br/>• Server-Side Only<br/>• Structured JSON Output"]:::data
    end

    UI --> EV
    EV --> CORE
    CORE --> DATA

    SW --> EL
    SW --> LG
    DL --> EL
    BC --> CI

    EL --> PS
    EL --> VS
    LG --> VS
    CI --> IT

    PS --> CK
    CK --> VS
    VS --> SB
    GE --> GM
    IT --> SB
```

**Key architectural principles:**

- **Strict server/client boundary** — privileged secrets (`GEMINI_API_KEY`) are enforced server-side in `src/lib/config/env.ts`; runtime exceptions are thrown if accessed in browser code.
- **Workspace isolation** — every database table that touches tenant data is governed by Row-Level Security (RLS) policies.
- **Verifiable citation discipline** — synthesis output is structured JSON, not free text, so every claim carries an explicit citation pointer that can be validated programmatically.

---

## 4. Evidence Lens™ — Claim-Level Verification Pipeline

The Evidence Lens™ is the heart of the platform. It refuses to accept an answer as "good" merely because it reads well — it requires that every claim be backed by a verbatim substring in an indexed source chunk.

```mermaid
flowchart TB
    classDef input fill:#E8EEF2,stroke:#526A80,stroke-width:2px,color:#17283B
    classDef process fill:#FFFFFF,stroke:#526A80,stroke-width:2px,color:#252B33
    classDef decision fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#252B33
    classDef supported fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#17283B
    classDef contradicted fill:#FBE9E7,stroke:#B65353,stroke-width:2px,color:#17283B
    classDef unresolved fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#17283B

    A["Generated Answer<br/>(LLM synthesis)"]:::input --> B["Claim Decomposition<br/>Atomic factual statements"]:::process
    B --> C["For each claim,<br/>extract cited quote<br/>+ chunk_id + page"]:::process
    C --> D{"Verbatim substring<br/>found in chunk?"}:::decision

    D -- "YES — exact match" --> E{"Does the passage<br/>support the claim?"}:::decision
    E -- "YES" --> F["Status: SUPPORTED<br/>Teal badge"]:::supported
    E -- "NO — opposite meaning" --> G["Status: CONTRADICTED<br/>Crimson badge"]:::contradicted

    D -- "NO — quote missing<br/>or paraphrased" --> H["Status: UNRESOLVED<br/>Amber badge"]:::unresolved

    F --> I["Interactive Split View<br/>Select claim → highlight source<br/>document + page number"]:::process
    G --> I
    H --> I

    I --> J{"Reviewer overrides?"}:::decision
    J -- "YES" --> K["Override + Justification Note<br/>Preserved in audit log"]:::process
    J -- "NO" --> L["Accept Automated Assessment"]:::process

    K --> M["Update Evidence Assessment<br/>+ Lineage Graph"]:::process
    L --> M
```

**Status taxonomy (matches the editorial color system in §11):**

| Status | Meaning | Badge color |
|--------|---------|-------------|
| `Supported` | Exact verbatim quote found, and the passage semantically supports the claim | Restrained Teal `#347C70` |
| `Contradicted` | Passage found but proves the opposite of what the claim asserts | Muted Crimson `#B65353` |
| `Unresolved` | No verbatim match — citation mismatch, paraphrase, or fabricated quote | Muted Amber `#B98237` |

---

## 5. Evidence Lineage Graph

The Lineage Graph makes the entire evidence chain **inspectable**. It is not just a debug view — it is a compliance artifact.

```mermaid
flowchart LR
    classDef node fill:#FFFFFF,stroke:#17283B,stroke-width:2px,color:#17283B
    classDef highlight fill:#E6F2EF,stroke:#347C70,stroke-width:3px,color:#17283B
    classDef decision fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#17283B

    U["User Inquiry"]:::node --> R["Retrieved Chunks<br/>(top-k via pgvector)"]:::node
    R --> S["Synthesis<br/>(Gemini 3.8 Flash)"]:::node
    S --> A["Asserted Claims<br/>Atomic factual statements"]:::node
    A --> C["Verifiable Citations<br/>chunk_id + page + quote"]:::node
    C --> E["Evidence Assessment<br/>Supported / Contradicted / Unresolved"]:::decision

    %% Highlighting example — reviewer selects claim #3
    A -.->|"reviewer selects claim #3"| HL["Upstream nodes<br/>light up<br/>to reveal dependency"]:::highlight
    HL -.-> R
    HL -.-> S
    HL -.-> C
```

An **accessible tabular view** mirrors the graph for screen-reader and keyboard users, ensuring WCAG compliance for reviewers who cannot rely on visual node highlighting.

---

## 6. Contradiction & Change-Impact Analysis

When a document is amended — for example, a clinical protocol changing from *"25 mg twice daily"* (v1) to *"50 mg once daily"* (v2) — every downstream answer, student note, and evaluation case that depended on the original passage must be flagged for re-review.

```mermaid
flowchart TB
    classDef trigger fill:#FBE9E7,stroke:#B65353,stroke-width:2px,color:#17283B
    classDef process fill:#FFFFFF,stroke:#526A80,stroke-width:2px,color:#252B33
    classDef review fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#17283B
    classDef resolved fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#17283B

    A["Document v1 ingested<br/>25 mg twice daily"]:::trigger --> B["Answers, notes,<br/>eval cases built on v1"]:::process
    C["Document v2 uploaded<br/>50 mg once daily"]:::trigger --> D["Contradiction Detector<br/>finds factual disagreement"]:::process

    D --> E["Side-by-Side Passage<br/>Comparison Drawer"]:::review
    E --> F{"Human Reviewer<br/>confirms contradiction?"}:::review

    F -- "YES — confirmed" --> G["Impact Tracker<br/>walks dependency graph"]:::process
    F -- "NO — false positive" --> H["Mark as 'reviewed_safe'<br/>Preserve audit entry"]:::resolved

    G --> I["Flag all downstream items<br/>status = needs_review"]:::review
    I --> J["Notify affected users<br/>+ add to compliance audit log"]:::resolved

    B -.->|"depends on"| G
```

**Why this matters:** Without impact tracking, amending a source document silently invalidates every answer that was ever grounded in it — and nobody finds out until the wrong information causes harm. PaperTrail makes that risk visible the moment a new version lands.

---

## 7. Developer Regression Lab & Adversarial Stress Tests

The Developer Regression Lab treats RAG quality as an engineering discipline, not a one-time tuning exercise. It runs parameterized benchmarks and exposes a curated suite of adversarial scenarios that probe known failure modes.

```mermaid
flowchart TB
    classDef config fill:#E8EEF2,stroke:#526A80,stroke-width:2px,color:#17283B
    classDef suite fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#17283B
    classDef run fill:#FFFFFF,stroke:#526A80,stroke-width:2px,color:#252B33
    classDef metric fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#17283B
    classDef compare fill:#FBE9E7,stroke:#B65353,stroke-width:2px,color:#17283B

    CFG["Configurable Parameters<br/>• top-k<br/>• similarity threshold<br/>• chunk size<br/>• model selection"]:::config --> RUN["Experiment Run"]:::run

    subgraph SUITE["Adversarial Stress Suite (Pre-Packaged)"]
        S1["Unanswerable<br/>Questions"]:::suite
        S2["Prompt Injections<br/>in Documents"]:::suite
        S3["Citation Mismatches<br/>(paraphrased / fabricated)"]:::suite
        S4["Multi-Hop Synthesis<br/>(cross-document reasoning)"]:::suite
    end

    SUITE --> RUN

    RUN --> M["Metrics Computed"]:::metric

    subgraph METRICS["Standard Metrics"]
        M1["Retrieval Precision & Recall"]:::metric
        M2["Citation Verbatim<br/>Correctness"]:::metric
        M3["Evidence Support Rate"]:::metric
        M4["Abstention Decision<br/>Accuracy"]:::metric
        M5["Average Query<br/>Latency (ms)"]:::metric
    end

    M --> METRICS
    METRICS --> CMP["Side-by-Side<br/>Experiment Comparison"]:::compare
    CMP --> OUT["Regression Report<br/>(shareable, exportable)"]:::metric
```

**Adversarial test philosophy:** the suite is not there to make the system look good — it exists to make the system *fail in a controlled way* so that real failures in production are rare.

---

## 8. End-to-End Request Lifecycle

The following sequence diagram traces a single user query from the moment it enters the application to the moment the answer lands on screen — with all safety, retrieval, and verification steps in between.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as Next.js App Router
    participant SAN as Prompt-Injection Sanitizer
    participant VS as Vector Search (pgvector)
    participant SB as Supabase Postgres
    participant GE as Gemini 3.8 Flash
    participant EL as Evidence Lens™
    participant LG as Lineage Graph

    U->>UI: Submit question (workspace-scoped)
    UI->>SAN: Sanitize input
    SAN-->>UI: Clean prompt
    UI->>VS: match_document_chunks(workspace_id, query_embedding, top_k)
    VS->>SB: Cosine similarity search (RLS-scoped)
    SB-->>VS: Top-k chunks (with page numbers)
    VS-->>UI: Retrieved chunks
    UI->>GE: Generate answer as structured JSON<br/>{ claims: [{ text, quote, chunk_id, page }] }
    GE-->>UI: Structured synthesis
    UI->>EL: Verify each claim's verbatim quote
    EL->>SB: Fetch chunk text by chunk_id
    SB-->>EL: Source passage
    EL-->>UI: Per-claim status (Supported / Contradicted / Unresolved)
    UI->>LG: Build lineage graph (inquiry → chunks → synthesis → claims → citations → assessment)
    LG-->>UI: Lineage graph + accessible table
    UI-->>U: Rendered answer with claim badges,<br/>split-view source highlighting, lineage panel
    Note over U,SB: If any claim is Unresolved → UI shows<br/>explicit abstention card with documented reason.
```

---

## 9. Database Schema (ERD)

The persistence layer is a normalized PostgreSQL schema hosted on Supabase, extended with `pgvector` for embedding storage and similarity search. The diagram below shows the core entities and their relationships.

```mermaid
erDiagram
    WORKSPACES ||--o{ PROFILES : "members"
    WORKSPACES ||--o{ MEMBERSHIPS : "has"
    PROFILES ||--o{ MEMBERSHIPS : "joins"
    WORKSPACES ||--o{ DOCUMENTS : "owns"
    DOCUMENTS ||--o{ DOCUMENT_VERSIONS : "versions"
    DOCUMENT_VERSIONS ||--o{ CHUNKS : "chunked into"
    CHUNKS }o--|| EMBEDDINGS : "has vector"
    WORKSPACES ||--o{ CONVERSATIONS : "contains"
    CONVERSATIONS ||--o{ MESSAGES : "has"
    MESSAGES ||--o{ CLAIMS : "decomposed into"
    CLAIMS ||--o{ CITATIONS : "cites"
    CITATIONS }o--|| CHUNKS : "points to"
    CLAIMS ||--|| EVIDENCE_ASSESSMENTS : "scored by"
    DOCUMENT_VERSIONS ||--o{ CONTRADICTION_CANDIDATES : "compared in"
    DOCUMENT_VERSIONS ||--o{ IMPACT_LINKS : "tracked by"
    WORKSPACES ||--o{ EVAL_DATASETS : "tests"
    EVAL_DATASETS ||--o{ TEST_CASES : "contains"
    EVAL_DATASETS ||--o{ REGRESSION_RUNS : "executes"
    REGRESSION_RUNS ||--o{ STUDENT_NOTES : "affects"
    WORKSPACES ||--o{ AUDIT_LOGS : "records"
    WORKSPACES ||--o{ FEEDBACK : "collects"

    PROFILES {
        uuid id PK
        text email
        text full_name
        timestamptz created_at
    }
    WORKSPACES {
        uuid id PK
        text name
        text slug
        timestamptz created_at
    }
    DOCUMENTS {
        uuid id PK
        uuid workspace_id FK
        text title
        text source_type
    }
    DOCUMENT_VERSIONS {
        uuid id PK
        uuid document_id FK
        int version_number
        text content_hash
        timestamptz created_at
    }
    CHUNKS {
        uuid id PK
        uuid version_id FK
        int page_number
        int token_count
        vector embedding
        text content
    }
    CLAIMS {
        uuid id PK
        uuid message_id FK
        text claim_text
        text status
        timestamptz created_at
    }
    CITATIONS {
        uuid id PK
        uuid claim_id FK
        uuid chunk_id FK
        text quoted_text
        int page_number
    }
    EVIDENCE_ASSESSMENTS {
        uuid id PK
        uuid claim_id FK
        text verdict
        text reviewer_override
        text justification
    }
    CONTRADICTION_CANDIDATES {
        uuid id PK
        uuid version_a_id FK
        uuid version_b_id FK
        text conflict_summary
        text review_state
    }
    REGRESSION_RUNS {
        uuid id PK
        uuid dataset_id FK
        jsonb parameters
        jsonb metrics
        timestamptz run_at
    }
    AUDIT_LOGS {
        uuid id PK
        uuid workspace_id FK
        text actor_id
        text action
        jsonb metadata
        timestamptz created_at
    }
```

**Migration policy:** schema changes are versioned under `supabase/migrations/` and never destructive — a consolidated `supabase/full_schema.sql` is published for fresh installs.

---

## 10. Security & Multi-Tenancy Model

PaperTrail is built for multi-tenant SaaS deployment from day one. Workspace isolation is enforced at **three reinforcing layers** — defense-in-depth, not defense-by-hope.

```mermaid
flowchart LR
    classDef layer fill:#FFFFFF,stroke:#17283B,stroke-width:2px,color:#17283B
    classDef enforce fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#17283B
    classDef deny fill:#FBE9E7,stroke:#B65353,stroke-width:2px,color:#17283B

    subgraph L1["Layer 1 — Application"]
        A1["Next.js Server Components<br/>enforce workspace_id in every query"]:::layer
    end

    subgraph L2["Layer 2 — Database (RLS)"]
        A2["Row-Level Security policies<br/>on every tenant table"]:::layer
        A2 -->|policy check| POL["auth.uid() ∈ workspace<br/>memberships"]:::enforce
    end

    subgraph L3["Layer 3 — Secrets"]
        A3["Server-side-only env vars<br/>enforced by src/lib/config/env.ts"]:::layer
        A3 -->|browser access| DENY["Runtime exception thrown"]:::deny
    end

    REQ["Incoming Request<br/>with session token"]:::layer --> A1
    A1 --> A2
    A2 --> A3
    A3 --> ALLOW["Allowed: data flows only<br/>within authenticated workspace"]:::enforce
```

**Verified by test:** `tests/workspace-isolation.test.ts` exercises multi-tenant vector filtering and confirms that a workspace A query can never retrieve chunks belonging to workspace B.

---

## 11. Editorial Design Language

PaperTrail deliberately rejects the generic "AI dashboard" aesthetic — no neon outlines, no glowing orbs, no decorative neural networks, no oversized chat bubbles. Instead, it draws from **analytical publishing, clinical research platforms, and judicial evidence archives**.

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

```mermaid
pie showData
    title Status Distribution (Sample Workspace)
    "Supported (Teal)" : 68
    "Unresolved (Amber)" : 22
    "Contradicted (Crimson)" : 10
```

The palette is deliberately **muted and editorial** — the visual energy goes into typography, evidence highlighting, and lineage graph structure, not into decorative gradients.

---

## 12. Project Structure

```
paper-trial-evidence-lab/
├── src/
│   ├── app/                     # Next.js 14 App Router pages & API routes
│   ├── components/              # React UI components (Evidence Lens, Lineage Graph, etc.)
│   ├── lib/
│   │   ├── config/env.ts        # Server-side-only secret enforcement
│   │   ├── chunker/             # Boundary-preserving chunker
│   │   ├── sanitizer/           # Prompt-injection sanitizer
│   │   ├── citation-validator/  # Verbatim quote verification
│   │   ├── evidence-lens/       # Claim decomposition & assessment
│   │   ├── lineage/             # Lineage graph builder
│   │   ├── contradiction/       # Cross-version contradiction detector
│   │   ├── impact-tracker/      # Downstream dependency tracker
│   │   └── supabase/            # Supabase client & RLS helpers
│   └── types/                   # Shared TypeScript types (Zod-validated)
├── supabase/
│   ├── migrations/              # 8 versioned SQL migrations
│   └── full_schema.sql          # Consolidated schema for fresh installs
├── tests/                       # Vitest suites (15 tests across 8 suites)
├── .env.example
├── .gitignore
├── README.md
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

**Tech stack:**

```mermaid
flowchart LR
    subgraph Frontend
        N["Next.js 14.2<br/>App Router"] --- R["React 18"] --- TW["Tailwind 3.4"] --- L["lucide-react"] --- Z["Zod"]
    end
    subgraph Backend
        SB["Supabase JS 2.45<br/>+ SSR"] --- GE["@google/generative-ai 0.21"] --- PP["pdf-parse 1.1"]
    end
    subgraph Data
        PG["PostgreSQL<br/>+ pgvector"] --- RLS["Row-Level Security"]
    end
    subgraph Quality
        TS["TypeScript 5.6"] --- VT["Vitest 2.1"] --- ESL["Next Lint"]
    end
    Frontend --> Backend --> Data
    Quality -.governs.-> Frontend
    Quality -.governs.-> Backend
```

---

## 13. Quick Start

### Prerequisites

- **Node.js** v20+
- **npm** v10+
- A **Supabase** project (free tier is fine)
- A **Google Gemini** API key

### Step 1 — Clone & Install

```bash
git clone https://github.com/reenuasrin2008/paper-trial-evidence-lab.git
cd paper-trial-evidence-lab
npm install
```

### Step 2 — Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase Configuration (Client-safe)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_publishable_key

# Google Gemini API Configuration (Server-side privileged only)
GEMINI_API_KEY=your_gemini_api_key
```

> **Security verification:** `.env.local` is strictly excluded in `.gitignore`. Privileged secrets like `GEMINI_API_KEY` are enforced as server-side only in `src/lib/config/env.ts` and will **throw runtime exceptions** if accessed in browser code.

### Step 3 — Apply Database Migrations

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor → New Query**.
3. Paste the contents of `supabase/full_schema.sql` and click **Run**.
4. Enable the **Vector** extension under **Database → Extensions** if not already enabled.

### Step 4 — Run the Application

```bash
# Production mode
npm run build
npm start

# Development mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Start Flow

```mermaid
flowchart LR
    A["git clone"]:::step --> B["npm install"]:::step
    B --> C["cp .env.example .env.local"]:::step
    C --> D["Paste Supabase<br/>+ Gemini keys"]:::step
    D --> E["Run supabase/full_schema.sql<br/>in Supabase SQL Editor"]:::step
    E --> F["Enable Vector extension"]:::step
    F --> G["npm run dev"]:::step
    G --> H["Open localhost:3000"]:::step

    classDef step fill:#FFFFFF,stroke:#526A80,stroke-width:2px,color:#17283B
```

---

## 14. Automated Tests

Run the full automated test suite using Vitest:

```bash
npm test          # one-shot
npm run test:watch  # watch mode
```

### Verified Test Suite — 15 tests passing across 8 suites

| Suite | File | What it verifies |
|-------|------|-----------------|
| Chunker | `tests/chunker.test.ts` | Boundary-preserving chunking, page numbers, overlap, token counts |
| Sanitizer | `tests/sanitizer.test.ts` | Neutralization of prompt injections (`ignore previous instructions`, etc.) |
| Citation Validator | `tests/citation-validator.test.ts` | Verbatim quote verification & citation mismatch detection |
| Evidence Lens | `tests/evidence-lens.test.ts` | Claim extraction, citation validation against chunks, support rate calculation |
| Lineage | `tests/lineage.test.ts` | Evidence Lineage Graph node & edge generation |
| Contradiction | `tests/contradiction.test.ts` | Polar conflict detection across documents, human review transitions |
| Impact Tracker | `tests/impact-tracker.test.ts` | Downstream dependency tracking on updated document versions |
| Workspace Isolation | `tests/workspace-isolation.test.ts` | Multi-tenant workspace data isolation & vector filtering |

```mermaid
flowchart LR
    classDef tested fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#17283B

    T1["Chunker<br/>boundary, overlap, tokens"]:::tested
    T2["Sanitizer<br/>injection neutralization"]:::tested
    T3["Citation Validator<br/>verbatim match"]:::tested
    T4["Evidence Lens<br/>claim decomposition"]:::tested
    T5["Lineage<br/>graph construction"]:::tested
    T6["Contradiction<br/>polar conflict detection"]:::tested
    T7["Impact Tracker<br/>downstream flags"]:::tested
    T8["Workspace Isolation<br/>RLS verification"]:::tested

    T1 --> ALL["15 Tests • 8 Suites • All Passing"]:::tested
    T2 --> ALL
    T3 --> ALL
    T4 --> ALL
    T5 --> ALL
    T6 --> ALL
    T7 --> ALL
    T8 --> ALL
```

---

## 15. Database Migrations

Versioned migrations are located in `supabase/migrations/`:

| # | Migration File | Purpose |
|---|----------------|---------|
| 1 | `00001_initial_schema_and_extensions.sql` | Enables `uuid-ossp`, `pgcrypto`, and `vector` (pgvector) |
| 2 | `00002_profiles_workspaces_memberships.sql` | User profiles, workspaces, role memberships |
| 3 | `00003_documents_versions_chunks.sql` | Document versions, chunks, similarity search RPC `match_document_chunks` |
| 4 | `00004_conversations_claims_citations.sql` | Conversations, messages, claims, citations, evidence assessments |
| 5 | `00005_contradictions_and_impact.sql` | Contradiction candidates and document impact dependency links |
| 6 | `00006_evaluations_experiments_stress.sql` | Eval datasets, test cases, regression runs, student notes |
| 7 | `00007_audit_and_feedback.sql` | Document collections, privacy-safe audit logging, human feedback |
| 8 | `00008_rls_policies.sql` | Comprehensive Row-Level Security enforcing workspace data isolation |

**Migration dependency flow:**

```mermaid
flowchart LR
    M1["00001<br/>extensions"]:::m --> M2["00002<br/>profiles, workspaces,<br/>memberships"]:::m
    M2 --> M3["00003<br/>documents, versions,<br/>chunks, match RPC"]:::m
    M3 --> M4["00004<br/>conversations, claims,<br/>citations, assessments"]:::m
    M4 --> M5["00005<br/>contradictions,<br/>impact links"]:::m
    M4 --> M6["00006<br/>eval datasets,<br/>regression runs"]:::m
    M5 --> M7["00007<br/>audit logs,<br/>feedback"]:::m
    M6 --> M7
    M7 --> M8["00008<br/>RLS policies<br/>(workspace isolation)"]:::m

    classDef m fill:#E8EEF2,stroke:#17283B,stroke-width:2px,color:#17283B
```

---

## 16. Deployment

The project is structured for **zero-config Vercel deployment**.

```mermaid
flowchart LR
    A["git push to main"] --> B["Vercel build<br/>Next.js 14 App Router"] --> C["Static pages<br/>+ serverless API routes"]
    C --> D{Env vars set?}
    D -- "YES" --> E["Deploy to production"]
    D -- "NO" --> F["Build fails fast<br/>with explicit error"]
    E --> G["Live at<br/>your-app.vercel.app"]
    G --> H["Connected to<br/>Supabase + Gemini"]
```

**Steps:**

1. Connect your GitHub repository to Vercel.
2. In **Project Settings → Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GEMINI_API_KEY`
3. Deploy! Next.js will build the static pages and deploy the API route handlers as serverless functions.

**Other deployment targets:** the app is a standard Next.js 14 build, so any platform that supports Node.js serverless functions (Netlify, Railway, Fly.io, AWS Amplify, self-hosted Docker) works equally well.

---

## 17. Roadmap

```mermaid
flowchart LR
    classDef done fill:#E6F2EF,stroke:#347C70,stroke-width:2px,color:#17283B
    classDef wip fill:#FDF4E3,stroke:#B98237,stroke-width:2px,color:#17283B
    classDef planned fill:#E8EEF2,stroke:#526A80,stroke-width:2px,color:#17283B

    v1["v1.0 — Core Platform<br/>• Evidence Lens™<br/>• Lineage Graph<br/>• Contradiction detection<br/>• Regression Lab<br/>• Audit export"]:::done
    v11["v1.1 — Multi-doc Reasoning<br/>• Multi-hop claim graph<br/>• Cross-document synthesis<br/>• Citation chains across versions"]:::wip
    v12["v1.2 — Reviewer Tooling<br/>• Batch override<br/>• Reviewer queues & SLAs<br/>• Diff-aware audit log"]:::planned
    v2["v2.0 — Enterprise<br/>• SSO / SAML<br/>• SOC 2 audit pack<br/>• On-prem deployment<br/>• Fine-tuned open models"]:::planned

    v1 --> v11 --> v12 --> v2
```

---

## 18. Contributing

Contributions are welcome. The project follows a standard fork → branch → PR workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make changes; ensure `npm test` passes.
4. Run `npm run lint` to satisfy the project's style rules.
5. Open a pull request describing the change, the rationale, and any tests added.

**What we especially welcome:**

- New adversarial stress-test scenarios for the Developer Regression Lab.
- Improvements to the citation validator's verbatim-match heuristic.
- Accessibility enhancements to the Lineage Graph and Evidence Lens UI.
- Additional language support in the document chunker (currently English-focused).

---

## 19. License

Released under the **MIT License**. See [`LICENSE`](LICENSE) for full text.

---

<div align="center">

**PaperTrail Evidence Lab** — *Every important answer must be traceable to its source evidence.*

Built with Next.js · Supabase · pgvector · Google Gemini · TypeScript · Vitest

</div>
