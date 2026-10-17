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
