-- PaperTrail Evidence Lab
-- Migration 00001: Initial Extensions and Utilities

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Utility function for automatic updated_at timestamping
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- PaperTrail Evidence Lab
-- Migration 00002: Profiles, Workspaces, and Memberships

-- Profiles linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER profiles_updated_at_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student', 'developer', 'business')),
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER workspaces_updated_at_trg
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Workspace Memberships with granular roles
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'reviewer', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

CREATE TRIGGER workspace_members_updated_at_trg
BEFORE UPDATE ON public.workspace_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- PaperTrail Evidence Lab
-- Migration 00003: Documents, Document Versions, Chunks, and Vector Search

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'txt', 'markdown')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER documents_updated_at_trg
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Document versions for tracking history and change impact
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  storage_path TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  total_pages INTEGER DEFAULT 1,
  total_chunks INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(document_id, version_number)
);

-- Document chunks with pgvector embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  embedding VECTOR(768), -- Gemini text-embedding-004 standard dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_doc_ver ON public.document_chunks(document_id, version_id);
CREATE INDEX IF NOT EXISTS idx_chunks_workspace ON public.document_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Vector similarity search RPC
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_workspace_id UUID,
  filter_document_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  version_id UUID,
  chunk_index INT,
  page_number INT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.version_id,
    dc.chunk_index,
    dc.page_number,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.metadata
  FROM public.document_chunks dc
  WHERE dc.workspace_id = filter_workspace_id
    AND (filter_document_ids IS NULL OR dc.document_id = ANY(filter_document_ids))
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
-- PaperTrail Evidence Lab
-- Migration 00004: Conversations, Messages, Claims, Citations, and Evidence Assessments

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Inquiry',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER conversations_updated_at_trg
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  abstention_type TEXT NOT NULL DEFAULT 'none' CHECK (abstention_type IN ('none', 'no_evidence', 'partial_evidence', 'conflicting_evidence')),
  confidence_score FLOAT DEFAULT 1.0,
  model_name TEXT,
  retrieval_trace JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Material claims extracted from assistant messages for Evidence Lens
CREATE TABLE IF NOT EXISTS public.answer_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'unresolved' CHECK (status IN ('supported', 'contradicted', 'unresolved')),
  confidence FLOAT DEFAULT 0.0,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Citations linking claims to concrete source chunks
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.answer_claims(id) ON DELETE CASCADE,
  chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
  exact_quote TEXT,
  page_number INTEGER,
  relevance_score FLOAT DEFAULT 0.0,
  is_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Evidence assessments (automated AI judge & human review)
CREATE TABLE IF NOT EXISTS public.evidence_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.answer_claims(id) ON DELETE CASCADE,
  assessment_status TEXT NOT NULL CHECK (assessment_status IN ('supported', 'contradicted', 'unresolved')),
  rationale TEXT NOT NULL,
  evaluator_type TEXT NOT NULL CHECK (evaluator_type IN ('automated', 'human')),
  evaluator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_message ON public.answer_claims(message_id);
CREATE INDEX IF NOT EXISTS idx_citations_claim ON public.citations(claim_id);
CREATE INDEX IF NOT EXISTS idx_citations_chunk ON public.citations(chunk_id);
CREATE INDEX IF NOT EXISTS idx_assessments_claim ON public.evidence_assessments(claim_id);
-- PaperTrail Evidence Lab
-- Migration 00005: Contradiction Candidates and Document Change Impact Links

CREATE TABLE IF NOT EXISTS public.contradiction_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chunk_a_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
  chunk_b_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
  doc_a_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  doc_b_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  passage_a TEXT NOT NULL,
  passage_b TEXT NOT NULL,
  page_a INTEGER DEFAULT 1,
  page_b INTEGER DEFAULT 1,
  disagreement_explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'confirmed_contradiction', 'rejected_compatible', 'unresolved')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER contradictions_updated_at_trg
BEFORE UPDATE ON public.contradiction_candidates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Document Change Impact Links (tracks downstream answers/evals dependent on document versions)
CREATE TABLE IF NOT EXISTS public.document_impact_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  impacted_type TEXT NOT NULL CHECK (impacted_type IN ('message', 'answer_claim', 'eval_test_case', 'student_note')),
  impacted_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('up_to_date', 'needs_review', 'reverified', 'stale')),
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER document_impact_updated_at_trg
BEFORE UPDATE ON public.document_impact_links
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_contra_workspace ON public.contradiction_candidates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_impact_doc ON public.document_impact_links(document_id, version_id);
CREATE INDEX IF NOT EXISTS idx_impact_target ON public.document_impact_links(impacted_type, impacted_id);
-- PaperTrail Evidence Lab
-- Migration 00006: Evaluation Datasets, Test Cases, Regression Experiments, and Student Notes

CREATE TABLE IF NOT EXISTS public.eval_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER eval_datasets_updated_at_trg
BEFORE UPDATE ON public.eval_datasets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.eval_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.eval_datasets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expected_answer TEXT,
  expected_evidence TEXT,
  category TEXT NOT NULL DEFAULT 'answerable' CHECK (category IN (
    'answerable',
    'unanswerable',
    'ambiguous',
    'conflicting_source',
    'multi_hop',
    'adversarial_injection',
    'citation_mismatch',
    'provider_failure'
  )),
  expected_abstention BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.experiment_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES public.eval_datasets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  retrieval_config JSONB NOT NULL DEFAULT '{"chunk_size": 500, "chunk_overlap": 50, "top_k": 5, "similarity_threshold": 0.65}'::jsonb,
  model_name TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-004',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  metrics_summary JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.run_case_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.experiment_runs(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES public.eval_test_cases(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  actual_output TEXT NOT NULL,
  retrieved_chunk_ids UUID[] DEFAULT '{}',
  actual_citations JSONB DEFAULT '[]'::jsonb,
  did_abstain BOOLEAN NOT NULL DEFAULT FALSE,
  abstention_correct BOOLEAN DEFAULT FALSE,
  retrieval_precision FLOAT DEFAULT 0.0,
  retrieval_recall FLOAT DEFAULT 0.0,
  citation_correctness FLOAT DEFAULT 0.0,
  evidence_support_rate FLOAT DEFAULT 0.0,
  latency_ms INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  judge_verdict TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Student workspace specific persistence: Saved Notes and Study Guides
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  source_page INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER student_notes_updated_at_trg
BEFORE UPDATE ON public.student_notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.study_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_ids UUID[] NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  key_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  revision_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_cases_dataset ON public.eval_test_cases(dataset_id);
CREATE INDEX IF NOT EXISTS idx_exp_runs_workspace ON public.experiment_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_case_results_run ON public.run_case_results(run_id);
-- PaperTrail Evidence Lab
-- Migration 00007: Collections, Audit Logging, and Human Feedback

-- Document Collections for Business Workspace
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER collections_updated_at_trg
BEFORE UPDATE ON public.collections
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.collection_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(collection_id, document_id)
);

-- Audit Events: privacy-aware logging (no sensitive raw text logged, only targets/hashes)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Human Review & Feedback on claims and citations
CREATE TABLE IF NOT EXISTS public.claim_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.answer_claims(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('status_override', 'citation_mismatch', 'retrieval_miss', 'reviewer_note')),
  corrected_status TEXT CHECK (corrected_status IN ('supported', 'contradicted', 'unresolved')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace ON public.audit_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_claim ON public.claim_feedback(claim_id);
-- PaperTrail Evidence Lab
-- Migration 00008: Row Level Security (RLS) Policies and Workspace Isolation

-- Helper function to check workspace membership and roles
CREATE OR REPLACE FUNCTION public.has_workspace_access(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contradiction_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_impact_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eval_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eval_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_case_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: users read all profiles, update own
CREATE POLICY "Users can view profile records" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Workspaces: visible to members
CREATE POLICY "Members can view workspaces" ON public.workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can update workspaces" ON public.workspaces FOR UPDATE
  USING (public.has_workspace_role(id, ARRAY['owner', 'admin']));

-- Workspace Members
CREATE POLICY "Members can view membership" ON public.workspace_members FOR SELECT
  USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Admins can manage members" ON public.workspace_members FOR ALL
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin']));

-- Documents & Versions
CREATE POLICY "Members view documents" ON public.documents FOR SELECT
  USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Members insert documents" ON public.documents FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));
CREATE POLICY "Members delete documents" ON public.documents FOR DELETE
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'reviewer']));

CREATE POLICY "Members view document versions" ON public.document_versions FOR SELECT
  USING (document_id IN (SELECT id FROM public.documents WHERE public.has_workspace_access(workspace_id)));
CREATE POLICY "Members insert document versions" ON public.document_versions FOR INSERT
  WITH CHECK (document_id IN (SELECT id FROM public.documents WHERE public.has_workspace_access(workspace_id)));

-- Document Chunks
CREATE POLICY "Members view chunks" ON public.document_chunks FOR SELECT
  USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Members insert chunks" ON public.document_chunks FOR INSERT
  WITH CHECK (public.has_workspace_access(workspace_id));

-- Conversations & Messages
CREATE POLICY "Users manage own conversations" ON public.conversations FOR ALL
  USING (user_id = auth.uid() AND public.has_workspace_access(workspace_id));
CREATE POLICY "Users view messages of accessible conversations" ON public.messages FOR SELECT
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid() OR public.has_workspace_access(workspace_id)));
CREATE POLICY "Users insert messages" ON public.messages FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Answer Claims, Citations, Evidence Assessments
CREATE POLICY "Members view claims" ON public.answer_claims FOR SELECT
  USING (message_id IN (SELECT m.id FROM public.messages m JOIN public.conversations c ON m.conversation_id = c.id WHERE public.has_workspace_access(c.workspace_id)));
CREATE POLICY "Members view citations" ON public.citations FOR SELECT
  USING (claim_id IN (SELECT ac.id FROM public.answer_claims ac JOIN public.messages m ON ac.message_id = m.id JOIN public.conversations c ON m.conversation_id = c.id WHERE public.has_workspace_access(c.workspace_id)));
CREATE POLICY "Members view assessments" ON public.evidence_assessments FOR SELECT
  USING (claim_id IN (SELECT ac.id FROM public.answer_claims ac JOIN public.messages m ON ac.message_id = m.id JOIN public.conversations c ON m.conversation_id = c.id WHERE public.has_workspace_access(c.workspace_id)));

-- Contradictions
CREATE POLICY "Members view contradictions" ON public.contradiction_candidates FOR SELECT
  USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Reviewers update contradictions" ON public.contradiction_candidates FOR UPDATE
  USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'reviewer']));

-- Document Impact Links
CREATE POLICY "Members view impact links" ON public.document_impact_links FOR SELECT
  USING (public.has_workspace_access(workspace_id));

-- Evaluations, Runs, Case Results
CREATE POLICY "Members view datasets" ON public.eval_datasets FOR SELECT USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Members manage datasets" ON public.eval_datasets FOR ALL USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'reviewer']));
CREATE POLICY "Members view test cases" ON public.eval_test_cases FOR SELECT
  USING (dataset_id IN (SELECT id FROM public.eval_datasets WHERE public.has_workspace_access(workspace_id)));
CREATE POLICY "Members view runs" ON public.experiment_runs FOR SELECT USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Members insert runs" ON public.experiment_runs FOR INSERT WITH CHECK (public.has_workspace_access(workspace_id));
CREATE POLICY "Members view run results" ON public.run_case_results FOR SELECT
  USING (run_id IN (SELECT id FROM public.experiment_runs WHERE public.has_workspace_access(workspace_id)));

-- Student Notes & Study Guides
CREATE POLICY "Users manage own student notes" ON public.student_notes FOR ALL
  USING (user_id = auth.uid() AND public.has_workspace_access(workspace_id));
CREATE POLICY "Users manage own study guides" ON public.study_guides FOR ALL
  USING (user_id = auth.uid() AND public.has_workspace_access(workspace_id));

-- Collections
CREATE POLICY "Members view collections" ON public.collections FOR SELECT USING (public.has_workspace_access(workspace_id));
CREATE POLICY "Members manage collections" ON public.collections FOR ALL USING (public.has_workspace_role(workspace_id, ARRAY['owner', 'admin', 'reviewer']));
CREATE POLICY "Members view collection items" ON public.collection_documents FOR SELECT
  USING (collection_id IN (SELECT id FROM public.collections WHERE public.has_workspace_access(workspace_id)));

-- Audit Events
CREATE POLICY "Members view audit events" ON public.audit_events FOR SELECT USING (public.has_workspace_access(workspace_id));
CREATE POLICY "System insert audit events" ON public.audit_events FOR INSERT WITH CHECK (public.has_workspace_access(workspace_id));

-- Claim Feedback
CREATE POLICY "Members manage feedback" ON public.claim_feedback FOR ALL USING (public.has_workspace_access(workspace_id));
