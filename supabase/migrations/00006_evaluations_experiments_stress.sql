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
