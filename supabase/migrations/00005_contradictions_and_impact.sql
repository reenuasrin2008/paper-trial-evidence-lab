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
