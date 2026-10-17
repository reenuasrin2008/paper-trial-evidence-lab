import { NextRequest, NextResponse } from "next/server";
import { chunkDocumentPages } from "@/lib/rag/chunker";
import { globalVectorStore } from "@/lib/rag/vector-store";

async function parsePDF(buffer: Buffer): Promise<Array<{ pageNumber: number; text: string }>> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);

  const totalPages = data.numpages || 1;
  const fullText: string = data.text;

  if (totalPages === 1) {
    return [{ pageNumber: 1, text: fullText }];
  }

  const paragraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const perPage = Math.ceil(paragraphs.length / totalPages);
  const pages: Array<{ pageNumber: number; text: string }> = [];

  for (let i = 0; i < totalPages; i++) {
    const slice = paragraphs.slice(i * perPage, (i + 1) * perPage);
    const pageText = slice.join("\n\n").trim();
    if (pageText.length > 0) {
      pages.push({ pageNumber: i + 1, text: pageText });
    }
  }

  return pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }];
}

function parseTextOrMarkdown(text: string): Array<{ pageNumber: number; text: string }> {
  const sections = text.split(/(?=\n#{1,3}\s+)/);
  if (sections.length > 1) {
    return sections.map((sec, i) => ({ pageNumber: i + 1, text: sec.trim() }));
  }

  const pageSize = 2000;
  const pages: Array<{ pageNumber: number; text: string }> = [];
  for (let i = 0; i < text.length; i += pageSize) {
    pages.push({
      pageNumber: Math.floor(i / pageSize) + 1,
      text: text.slice(i, i + pageSize).trim(),
    });
  }
  return pages.length > 0 ? pages : [{ pageNumber: 1, text }];
}

export async function processDocumentUpload(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = (formData.get("workspaceId") as string) || "demo-workspace";
    const documentTitle = (formData.get("title") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    const isPDF = lowerName.endsWith(".pdf") || file.type === "application/pdf";
    const isMarkdown = lowerName.endsWith(".md") || lowerName.endsWith(".markdown") || file.type === "text/markdown";
    const isText = lowerName.endsWith(".txt") || file.type === "text/plain";

    if (!isPDF && !isMarkdown && !isText) {
      return NextResponse.json(
        { error: "Unsupported format. Only PDF, Markdown (.md), and plain text (.txt) files are supported." },
        { status: 400 }
      );
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 15 MB limit" }, { status: 413 });
    }

    let pages: Array<{ pageNumber: number; text: string }> = [];

    if (isPDF) {
      const buffer = Buffer.from(await file.arrayBuffer());
      pages = await parsePDF(buffer);
    } else {
      const textContent = await file.text();
      pages = parseTextOrMarkdown(textContent);
    }

    const docId = `doc-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const versionId = `ver-${docId}-1`;
    const cleanTitle =
      documentTitle ||
      file.name
        .replace(/\.(pdf|md|markdown|txt)$/i, "")
        .replace(/[-_]/g, " ")
        .trim();

    const chunks = chunkDocumentPages(pages, {
      documentId: docId,
      versionId,
      workspaceId,
      documentTitle: cleanTitle,
      chunkSize: 600,
      chunkOverlap: 80,
    });

    await globalVectorStore.addChunks(chunks);

    return NextResponse.json({
      documentId: docId,
      versionId,
      title: cleanTitle,
      workspaceId,
      totalPages: pages.length,
      totalChunks: chunks.length,
      fileType: isPDF ? "pdf" : isMarkdown ? "markdown" : "txt",
      message: `Successfully indexed "${cleanTitle}" — ${chunks.length} passages ready for search in ${workspaceId}.`,
    });
  } catch (error) {
    console.error("Document upload processing error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to process document" },
      { status: 500 }
    );
  }
}
