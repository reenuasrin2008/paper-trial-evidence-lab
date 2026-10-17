// PaperTrail Evidence Lab — Core Domain Types

export type WorkspaceType = "student" | "developer" | "researcher" | "business";
export type WorkspaceRole = "owner" | "admin" | "reviewer" | "member" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  fileType: "pdf" | "txt" | "markdown";
  currentVersionId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storagePath?: string;
  fileSize: number;
  checksum?: string;
  totalPages: number;
  totalChunks: number;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  versionId: string;
  workspaceId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
  embedding?: number[];
  metadata?: {
    documentTitle?: string;
    sectionTitle?: string;
    keywords?: string[];
    [key: string]: unknown;
  };
}

export interface RetrievalResult {
  chunk: DocumentChunk;
  similarity: number;
  score: number;
  rank: number;
}

export type AbstentionType = "none" | "no_evidence" | "partial_evidence" | "conflicting_evidence";

export type ClaimStatus = "supported" | "contradicted" | "unresolved";

export interface Claim {
  id: string;
  messageId: string;
  claimText: string;
  claimOrder: number;
  status: ClaimStatus;
  confidence: number;
  reviewerNotes?: string;
  citations: Citation[];
  assessment?: EvidenceAssessment;
}

export interface Citation {
  id: string;
  claimId: string;
  chunkId?: string;
  documentId?: string;
  versionId?: string;
  documentTitle?: string;
  exactQuote: string;
  pageNumber?: number;
  relevanceScore: number;
  isValidated: boolean;
}

export interface EvidenceAssessment {
  id: string;
  claimId: string;
  assessmentStatus: ClaimStatus;
  rationale: string;
  evaluatorType: "automated" | "human";
  evaluatorId?: string;
  evaluatorName?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  abstentionType: AbstentionType;
  confidenceScore: number;
  modelName?: string;
  retrievalTrace?: {
    retrievedCount: number;
    topSimilarity: number;
    retrievedChunkIds: string[];
    latencyMs: number;
  };
  claims?: Claim[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface LineageNode {
  id: string;
  type: "question" | "chunk" | "answer" | "claim" | "citation" | "assessment";
  label: string;
  title?: string;
  status?: ClaimStatus | AbstentionType;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface ContradictionCandidate {
  id: string;
  workspaceId: string;
  chunkAId?: string;
  chunkBId?: string;
  docAId: string;
  docBId: string;
  docATitle: string;
  docBTitle: string;
  passageA: string;
  passageB: string;
  pageA: number;
  pageB: number;
  disagreementExplanation: string;
  status: "unreviewed" | "confirmed_contradiction" | "rejected_compatible" | "unresolved";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  createdAt: string;
}

export interface DocumentImpactLink {
  id: string;
  workspaceId: string;
  documentId: string;
  documentTitle: string;
  versionId: string;
  versionNumber: number;
  impactedType: "message" | "answer_claim" | "eval_test_case" | "student_note";
  impactedId: string;
  impactedTitle: string;
  status: "up_to_date" | "needs_review" | "reverified" | "stale";
  changeSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvalTestCase {
  id: string;
  datasetId: string;
  question: string;
  expectedAnswer?: string;
  expectedEvidence?: string;
  category:
    | "answerable"
    | "unanswerable"
    | "ambiguous"
    | "conflicting_source"
    | "multi_hop"
    | "adversarial_injection"
    | "citation_mismatch"
    | "provider_failure";
  expectedAbstention: boolean;
}

export interface ExperimentRun {
  id: string;
  workspaceId: string;
  datasetId?: string;
  datasetName?: string;
  name: string;
  retrievalConfig: {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    similarityThreshold: number;
  };
  modelName: string;
  embeddingModel: string;
  status: "pending" | "running" | "completed" | "failed";
  metricsSummary: {
    totalCases: number;
    accuracy: number;
    precision: number;
    recall: number;
    citationCorrectness: number;
    supportRate: number;
    abstentionF1: number;
    avgLatencyMs: number;
  };
  results?: RunCaseResult[];
  createdAt: string;
  completedAt?: string;
}

export interface RunCaseResult {
  id: string;
  runId: string;
  testCaseId?: string;
  question: string;
  actualOutput: string;
  retrievedChunkIds: string[];
  actualCitations: Citation[];
  didAbstain: boolean;
  abstentionCorrect: boolean;
  retrievalPrecision: number;
  retrievalRecall: number;
  citationCorrectness: number;
  evidenceSupportRate: number;
  latencyMs: number;
  tokenCount: number;
  judgeVerdict: "passed" | "failed" | "abstention_error" | "citation_mismatch";
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==========================================
// UNIVERSAL VISUAL ANSWERING ENGINE TYPES
// ==========================================
export type VisualExplanationType =
  | "flowchart"
  | "concept_map"
  | "architecture"
  | "sequence"
  | "timeline"
  | "comparison_table"
  | "chart"
  | "decision_tree"
  | "none";

export interface VisualExplanationNode {
  id: string;
  label: string;
  type?: string;
  description?: string;
  sourceQuote?: string;
  pageNumber?: number;
  documentTitle?: string;
  metrics?: string;
  isReported?: boolean; // true = explicitly reported in source; false = analytical deduction
}

export interface VisualExplanationEdge {
  from: string;
  to: string;
  label?: string;
  relationType?: string;
}

export interface VisualExplanation {
  type: VisualExplanationType;
  title: string;
  description: string;
  reportedVsInferred: "reported_fact" | "inferred_relationship" | "hybrid";
  nodes: VisualExplanationNode[];
  edges?: VisualExplanationEdge[];
  tableData?: {
    headers: string[];
    rows: Array<Record<string, string>>;
  };
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      unit?: string;
    }>;
    sourceQuote?: string;
  };
  timelineEvents?: Array<{
    date: string;
    title: string;
    description: string;
    sourceQuote?: string;
    pageNumber?: number;
  }>;
  textAlternative: string;
  limitationNote?: string;
}

// ==========================================
// RESEARCHER WORKSPACE TYPES
// ==========================================
export interface ResearchPaperMetadata {
  documentId: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  abstract: string;
  researchQuestion: string;
  objectives: string[];
  methodology: string;
  dataset: string;
  sampleSize?: string;
  experimentalConditions: string[];
  modelsAndAlgorithms: string[];
  baselines: string[];
  evaluationMetrics: string[];
  quantitativeFindings: Array<{
    metric: string;
    value: string;
    unit?: string;
    quote: string;
    page?: number;
  }>;
  limitations: string[];
  assumptions: string[];
  futureWork: string[];
  conclusions: string[];
  totalChunks: number;
  totalPages: number;
}

export type ScholarlyRelationship =
  | "similar_question"
  | "similar_methodology"
  | "alternative_approach"
  | "foundational"
  | "follow_up"
  | "different_result"
  | "addresses_limitation";

export interface ScholarlyPaper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  doi: string | null;
  url: string | null;
  abstract: string;
  citationCount?: number;
  relevanceScore: number;
  relationshipToUploadedPaper: string;
  relationshipType: ScholarlyRelationship;
  keyDifferences: string;
  isExternal: boolean; // true = from OpenAlex/Crossref API; false = from local workspace library
}

export interface PaperComparisonReport {
  paperIds: string[];
  paperTitles: string[];
  writtenSynthesis: string;
  dimensionMatrix: Array<{
    dimension: string;
    values: Record<string, string>;
    citations: Record<string, string>;
    status: "agreement" | "difference" | "not_comparable";
  }>;
  agreements: string[];
  disagreements: Array<{
    topic: string;
    explanation: string;
    docAQuote: string;
    docBQuote: string;
  }>;
  researchGaps: string[];
  supportingPassages: Array<{
    paperTitle: string;
    page: number;
    quote: string;
  }>;
}

// ==========================================
// DOCUMENT VERSION DIFF & CHANGE IMPACT TYPES
// ==========================================
export interface DocumentVersionDiff {
  docId: string;
  docTitle: string;
  versionA: number;
  versionB: number;
  addedPassages: Array<{ text: string; page: number }>;
  removedPassages: Array<{ text: string; page: number }>;
  modifiedPassages: Array<{
    original: string;
    revised: string;
    page: number;
    changeType: "dosing" | "procedure" | "metric" | "policy" | "general";
  }>;
  changedNumbersOrDates: Array<{
    field: string;
    from: string;
    to: string;
    explanation: string;
  }>;
  affectedClaims: Array<{
    claimId: string;
    claimText: string;
    risk: "invalidated" | "needs_review" | "unaffected";
    reason: string;
  }>;
  summary: string;
}

