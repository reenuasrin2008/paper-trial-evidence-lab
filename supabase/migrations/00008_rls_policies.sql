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
