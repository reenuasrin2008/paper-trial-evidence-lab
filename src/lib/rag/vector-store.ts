// Vector Storage and Cosine Similarity Retrieval
import { DocumentChunk, RetrievalResult } from "./types";
import { generateEmbedding, generateDeterministicEmbedding } from "../gemini/client";

// Cosine similarity computation between two normalized vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

export class VectorStore {
  private chunks: Map<string, DocumentChunk> = new Map();

  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        chunk.embedding = await generateEmbedding(chunk.content);
      }
      this.chunks.set(chunk.id, chunk);
    }
  }

  getChunk(chunkId: string): DocumentChunk | undefined {
    return this.chunks.get(chunkId);
  }

  getAllChunks(workspaceId?: string): DocumentChunk[] {
    const all = Array.from(this.chunks.values());
    if (!workspaceId) return all;
    return all.filter((c) => c.workspaceId === workspaceId);
  }

  async search(
    query: string,
    options: {
      workspaceId: string;
      documentIds?: string[];
      topK?: number;
      similarityThreshold?: number;
    }
  ): Promise<RetrievalResult[]> {
    const topK = options.topK || 5;
    const threshold = options.similarityThreshold ?? 0.45;
    const queryEmbedding = await generateEmbedding(query);

    const candidates = Array.from(this.chunks.values()).filter((chunk) => {
      if (chunk.workspaceId !== options.workspaceId) return false;
      if (options.documentIds && options.documentIds.length > 0) {
        return options.documentIds.includes(chunk.documentId);
      }
      return true;
    });

    const scored: Array<{ chunk: DocumentChunk; similarity: number }> = [];

    for (const chunk of candidates) {
      const embedding = chunk.embedding || generateDeterministicEmbedding(chunk.content);
      const sim = cosineSimilarity(queryEmbedding, embedding);
      if (sim >= threshold) {
        scored.push({ chunk, similarity: sim });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, topK).map((item, idx) => ({
      chunk: item.chunk,
      similarity: Number(item.similarity.toFixed(4)),
      score: Number(item.similarity.toFixed(4)),
      rank: idx + 1,
    }));
  }

  clearWorkspace(workspaceId: string): void {
    for (const [id, chunk] of Array.from(this.chunks.entries())) {
      if (chunk.workspaceId === workspaceId) {
        this.chunks.delete(id);
      }
    }
  }
}

// Global singleton vector store instance
export const globalVectorStore = new VectorStore();
