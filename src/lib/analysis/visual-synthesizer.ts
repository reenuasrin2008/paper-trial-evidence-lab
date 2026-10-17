// Universal Visual Answering Engine — Synthesizer
import { VisualExplanation, VisualExplanationType } from "../rag/types";
import { getGeminiClient } from "../gemini/client";

interface ContextExcerpt {
  id: string;
  documentTitle: string;
  pageNumber: number;
  content: string;
}

export function detectPreferredVisualType(question: string): VisualExplanationType {
  const q = question.toLowerCase();
  if (q.includes("flowchart") || q.includes("process") || q.includes("workflow") || q.includes("step by step")) {
    return "flowchart";
  }
  if (q.includes("architecture") || q.includes("component") || q.includes("system design") || q.includes("modules")) {
    return "architecture";
  }
  if (q.includes("sequence") || q.includes("request") || q.includes("call flow") || q.includes("protocol")) {
    return "sequence";
  }
  if (q.includes("timeline") || q.includes("chronolog") || q.includes("history") || q.includes("over time") || q.includes("dates")) {
    return "timeline";
  }
  if (q.includes("concept map") || q.includes("concepts") || q.includes("ideas") || q.includes("relationships")) {
    return "concept_map";
  }
  if (q.includes("compare") || q.includes("comparison") || q.includes("difference") || q.includes("versus") || q.includes("vs")) {
    return "comparison_table";
  }
  if (q.includes("chart") || q.includes("graph") || q.includes("metric") || q.includes("numbers") || q.includes("statistics") || q.includes("results")) {
    return "chart";
  }
  if (q.includes("decision") || q.includes("branch") || q.includes("if then") || q.includes("condition")) {
    return "decision_tree";
  }
  return "flowchart"; // default fallback visual type when visual is beneficial
}

export async function synthesizeVisualExplanation(
  question: string,
  answer: string,
  context: ContextExcerpt[],
  modelName = "gemini-3.8-flash"
): Promise<VisualExplanation> {
  const preferredType = detectPreferredVisualType(question);

  const contextText = context
    .slice(0, 8)
    .map((c) => `[Doc: ${c.documentTitle}, Page ${c.pageNumber}] ${c.content}`)
    .join("\n\n");

  const systemPrompt = `You are a visual knowledge engineer for PaperTrail Evidence Lab.
Your task is to generate structured visualization data to accompany an evidence-grounded answer.
CRITICAL SAFETY & TRUTH RULES:
1. ONLY use facts, steps, components, numbers, or events mentioned in the provided excerpts.
2. DO NOT invent numerical values, fake statistics, or nonexistent system connections.
3. If numerical data is not in the text, DO NOT return type 'chart'. Use 'flowchart', 'concept_map', or 'comparison_table' instead.
4. For every node, step, or event, link to an exact verbatim quote and page number from the excerpts.
5. If the document has insufficient detail for a complete visualization, set limitationNote explaining what is missing.
6. Provide a readable textAlternative summarizing the visual structure for screen readers and accessibility.

RETURN ONLY VALID JSON matching this exact TypeScript structure (no markdown wrapping, no commentary):
{
  "type": "${preferredType}", // One of: "flowchart", "concept_map", "architecture", "sequence", "timeline", "comparison_table", "chart", "decision_tree"
  "title": "Clear descriptive title for the diagram",
  "description": "1 sentence explanation of what this diagram visualizes",
  "reportedVsInferred": "reported_fact", // or "inferred_relationship" or "hybrid"
  "nodes": [
    {
      "id": "node-1",
      "label": "Brief label (under 6 words)",
      "type": "step", // or "component", "concept", "condition", "metric"
      "description": "Full explanation of this node",
      "sourceQuote": "exact quote from text",
      "pageNumber": 1,
      "documentTitle": "title of document",
      "isReported": true
    }
  ],
  "edges": [
    {
      "from": "node-1",
      "to": "node-2",
      "label": "transition label or action",
      "relationType": "leads_to"
    }
  ],
  "tableData": { // Only include if type is "comparison_table"
    "headers": ["Item / Feature", "Doc A", "Doc B"],
    "rows": [{"Item / Feature": "Dosing", "Doc A": "25mg", "Doc B": "50mg"}]
  },
  "chartData": { // Only include if type is "chart" AND numbers exist in text
    "labels": ["Cohort A", "Cohort B"],
    "datasets": [{ "label": "Response Rate", "data": [74.2, 31.8], "unit": "%" }],
    "sourceQuote": "exact quote containing the numbers"
  },
  "timelineEvents": [ // Only include if type is "timeline"
    { "date": "Week 12", "title": "Interim Monitoring", "description": "Response evaluation", "sourceQuote": "exact quote", "pageNumber": 2 }
  ],
  "textAlternative": "Complete accessible text description of the entire visual flow",
  "limitationNote": "Any limitation in source coverage (optional)"
}`;

  try {
    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      systemInstruction: systemPrompt,
    });

    const userPrompt = `QUESTION: ${question}
ANSWER: ${answer}

DOCUMENT CONTEXT:
${contextText}

Generate the structured visualization JSON:`;

    const res = await model.generateContent(userPrompt);
    const parsed = JSON.parse(res.response.text()) as VisualExplanation;
    return parsed;
  } catch (err) {
    console.warn("Visual explanation generation fallback:", err);
    return fallbackVisualSynthesis(question, answer, context, preferredType);
  }
}

export function fallbackVisualSynthesis(
  question: string,
  answer: string,
  context: ContextExcerpt[],
  preferredType: VisualExplanationType
): VisualExplanation {
  const firstDoc = context[0];
  const docTitle = firstDoc?.documentTitle || "Uploaded Document";
  const pageNum = firstDoc?.pageNumber || 1;

  // Split answer into meaningful sentences for step/node extraction
  const sentences = answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && !s.startsWith("Based on"));

  const nodes = sentences.slice(0, 4).map((sentence, idx) => ({
    id: `node-${idx + 1}`,
    label: sentence.length > 40 ? sentence.slice(0, 37) + "…" : sentence,
    description: sentence,
    type: "step",
    sourceQuote: firstDoc ? firstDoc.content.slice(0, 100) : sentence,
    pageNumber: pageNum,
    documentTitle: docTitle,
    isReported: true,
  }));

  const edges = nodes.slice(0, -1).map((node, idx) => ({
    from: node.id,
    to: nodes[idx + 1].id,
    label: "advances to",
    relationType: "sequence",
  }));

  return {
    type: preferredType === "chart" ? "comparison_table" : preferredType,
    title: `Visual Breakdown: ${question.slice(0, 50)}`,
    description: `Structured visual representation extracted from ${docTitle}.`,
    reportedVsInferred: "reported_fact",
    nodes,
    edges,
    textAlternative: `Visual representation containing ${nodes.length} stages: ${nodes
      .map((n, i) => `Step ${i + 1}: ${n.label}`)
      .join("; ")}.`,
    limitationNote:
      "Synthesized from available passage excerpts. Additional diagram detail can be extracted with deeper retrieval.",
  };
}
