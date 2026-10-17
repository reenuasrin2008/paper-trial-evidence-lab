import { describe, it, expect } from "vitest";
import { chunkDocumentPages } from "../src/lib/rag/chunker";

describe("Document Chunker & Page Metadata", () => {
  it("preserves exact page numbers across document chunks", () => {
    const pages = [
      { pageNumber: 1, text: "Page one introduction. This covers clinical cohort design." },
      { pageNumber: 2, text: "Page two safety analysis. Primary endpoint was reached at week 12." },
    ];

    const chunks = chunkDocumentPages(pages, {
      documentId: "doc-test-1",
      versionId: "ver-1",
      workspaceId: "ws-test",
      documentTitle: "Clinical Trial Protocol",
    });

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks[0].metadata?.documentTitle).toBe("Clinical Trial Protocol");
  });

  it("calculates positive token counts and respects chunk boundary limits", () => {
    const longText = new Array(50).fill("Evaluating pharmacokinetic properties of PT-902.").join(" ");
    const pages = [{ pageNumber: 1, text: longText }];

    const chunks = chunkDocumentPages(pages, {
      documentId: "doc-test-2",
      versionId: "ver-1",
      workspaceId: "ws-test",
      chunkSize: 300,
      chunkOverlap: 40,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.content.length).toBeGreaterThan(0);
    }
  });
});
