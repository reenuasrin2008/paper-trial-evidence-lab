import { NextRequest, NextResponse } from "next/server";
import { globalVectorStore } from "@/lib/rag/vector-store";
import { getGeminiClient } from "@/lib/gemini/client";

export interface PaperOverview {
  title: string;
  summary: string;
  researchQuestion: string;
  methodology: string;
  keyFindings: string[];
  limitations: string[];
  assumptions: string[];
  potentialWeaknesses: string[];
  totalChunks: number;
  totalPages: number;
}

export async function POST(req: NextRequest) {
  let documentId = "";
  let workspaceId = "demo-workspace";
  let title = "";

  try {
    const body = await req.json();
    documentId = body.documentId || "";
    workspaceId = body.workspaceId || "demo-workspace";
    title = body.title || "";

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    // Get all chunks for this document
    const allChunks = globalVectorStore.getAllChunks(workspaceId).filter(
      (c) => c.documentId === documentId
    );

    if (allChunks.length === 0) {
      return NextResponse.json(
        { error: "No indexed chunks found for this document" },
        { status: 404 }
      );
    }

    const maxPages = Math.max(...allChunks.map((c) => c.pageNumber));

    // Build a context from the first ~12 chunks for overview
    const contextText = allChunks
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .slice(0, 12)
      .map((c) => `[Page ${c.pageNumber}] ${c.content}`)
      .join("\n\n");

    const systemInstruction = `You are an expert research paper analyst. Given excerpts from a research paper, produce a structured JSON overview.

Return ONLY valid JSON matching exactly this shape (no markdown, no extra text):
{
  "summary": "2-3 sentence overview of the paper",
  "researchQuestion": "The core research question or objective",
  "methodology": "Brief description of methods used",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "limitations": ["Limitation 1", "Limitation 2"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "potentialWeaknesses": ["Weakness 1", "Weakness 2"]
}`;

    const ai = getGeminiClient();
    const model = ai.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      systemInstruction,
    });

    const prompt = `PAPER TITLE: ${title || "Research Paper"}\n\nEXCERPTS:\n${contextText}\n\nGenerate the structured paper overview:`;
    const response = await model.generateContent(prompt);
    const rawText = response.response.text();
    const parsed = JSON.parse(rawText);

    const overview: PaperOverview = {
      title: title || "Research Paper",
      ...parsed,
      totalChunks: allChunks.length,
      totalPages: maxPages,
    };

    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Paper overview error:", error);

    // Fallback: return a basic overview without Gemini
    const allChunks = globalVectorStore
      .getAllChunks(workspaceId)
      .filter((c) => c.documentId === documentId);

    const fallback: PaperOverview = {
      title: title || "Research Paper",
      summary:
        "This document has been successfully indexed and is ready for evidence-based Q&A. Use the Evidence Q&A tab to ask questions about this paper.",
      researchQuestion:
        "Please use Evidence Q&A to query the specific research objectives of this paper.",
      methodology:
        "Query the paper directly to explore the methodology in detail.",
      keyFindings: [
        "Document indexed successfully — ask questions to extract specific findings.",
      ],
      limitations: ["Full overview unavailable — use Q&A to explore limitations."],
      assumptions: [],
      potentialWeaknesses: [],
      totalChunks: allChunks.length,
      totalPages: allChunks.length > 0 ? Math.max(...allChunks.map((c) => c.pageNumber)) : 0,
    };

    return NextResponse.json({ overview: fallback });
  }
}
