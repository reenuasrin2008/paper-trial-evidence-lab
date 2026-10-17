// Document Chunking Engine with page preservation and boundary detection

import { DocumentChunk } from "./types";
import { sanitizeDocumentContent } from "./sanitizer";

export interface ChunkingOptions {
  chunkSize?: number; // In approximate words or characters (default: 450 characters)
  chunkOverlap?: number; // Overlap in characters (default: 50 characters)
  documentId: string;
  versionId: string;
  workspaceId: string;
  documentTitle?: string;
}

export interface RawPage {
  pageNumber: number;
  text: string;
}

export function chunkDocumentPages(
  pages: RawPage[],
  options: ChunkingOptions
): DocumentChunk[] {
  const chunkSize = options.chunkSize || 450;
  const chunkOverlap = options.chunkOverlap || 50;
  const chunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const { cleanedText } = sanitizeDocumentContent(page.text);
    if (!cleanedText) continue;

    // Segment page by paragraphs or sentences
    const paragraphs = cleanedText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    let currentChunk = "";

    for (const para of paragraphs) {
      if ((currentChunk + " " + para).length <= chunkSize) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
      } else {
        if (currentChunk.trim().length > 0) {
          chunks.push({
            id: `chunk-${options.documentId}-${globalChunkIndex}`,
            documentId: options.documentId,
            versionId: options.versionId,
            workspaceId: options.workspaceId,
            chunkIndex: globalChunkIndex++,
            pageNumber: page.pageNumber,
            content: currentChunk.trim(),
            tokenCount: Math.ceil(currentChunk.length / 4),
            metadata: {
              documentTitle: options.documentTitle,
              pageNumber: page.pageNumber,
            },
          });
        }

        // If the single paragraph exceeds chunkSize, split by sentences
        if (para.length > chunkSize) {
          const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g) || [para];
          let subChunk = "";
          for (const sentence of sentences) {
            if ((subChunk + sentence).length <= chunkSize) {
              subChunk += sentence;
            } else {
              if (subChunk.trim().length > 0) {
                chunks.push({
                  id: `chunk-${options.documentId}-${globalChunkIndex}`,
                  documentId: options.documentId,
                  versionId: options.versionId,
                  workspaceId: options.workspaceId,
                  chunkIndex: globalChunkIndex++,
                  pageNumber: page.pageNumber,
                  content: subChunk.trim(),
                  tokenCount: Math.ceil(subChunk.length / 4),
                  metadata: {
                    documentTitle: options.documentTitle,
                    pageNumber: page.pageNumber,
                  },
                });
              }
              // Carry over overlap
              subChunk = subChunk.slice(-chunkOverlap) + sentence;
            }
          }
          currentChunk = subChunk;
        } else {
          // Carry over overlap from previous chunk
          const overlapText = currentChunk.slice(-chunkOverlap);
          currentChunk = overlapText ? `${overlapText} ${para}` : para;
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `chunk-${options.documentId}-${globalChunkIndex}`,
        documentId: options.documentId,
        versionId: options.versionId,
        workspaceId: options.workspaceId,
        chunkIndex: globalChunkIndex++,
        pageNumber: page.pageNumber,
        content: currentChunk.trim(),
        tokenCount: Math.ceil(currentChunk.length / 4),
        metadata: {
          documentTitle: options.documentTitle,
          pageNumber: page.pageNumber,
        },
      });
    }
  }

  return chunks;
}
