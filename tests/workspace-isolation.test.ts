import { describe, it, expect } from "vitest";
import { VectorStore } from "../src/lib/rag/vector-store";
import { DocumentChunk } from "../src/lib/rag/types";

describe("Workspace Vector Isolation", () => {
  it("strictly filters out chunks belonging to other workspaces", async () => {
    const store = new VectorStore();

    const chunkWorkspaceA: DocumentChunk = {
      id: "chunk-ws-a",
      documentId: "doc-a",
      versionId: "ver-1",
      workspaceId: "workspace-alpha",
      chunkIndex: 0,
      pageNumber: 1,
      content: "Confidential financial quarterly projections for Company Alpha.",
      tokenCount: 10,
    };

    const chunkWorkspaceB: DocumentChunk = {
      id: "chunk-ws-b",
      documentId: "doc-b",
      versionId: "ver-1",
      workspaceId: "workspace-beta",
      chunkIndex: 0,
      pageNumber: 1,
      content: "Public research results for University Beta.",
      tokenCount: 8,
    };

    await store.addChunks([chunkWorkspaceA, chunkWorkspaceB]);

    // Query from workspace-beta
    const results = await store.search("quarterly financial projections", {
      workspaceId: "workspace-beta",
      similarityThreshold: 0.1,
    });

    // Should NOT contain chunk-ws-a from workspace-alpha!
    expect(results.some((r) => r.chunk.id === "chunk-ws-a")).toBe(false);
  });
});
