import { describe, it, expect } from "vitest";
import { fallbackLibraryComparison } from "../src/lib/research/scholarly-service";
import { fallbackPaperComparison } from "../src/lib/research/comparison-service";

describe("Researcher Workspace — Discovery & Multi-Paper Comparison", () => {
  it("returns verified scholarly comparisons against workspace library on fallback", () => {
    const papers = fallbackLibraryComparison("Phase III Clinical Protocol: PT-902");

    expect(papers.length).toBeGreaterThan(0);
    expect(papers[0].title).toBeTruthy();
    expect(papers[0].relationshipToUploadedPaper).toBeTruthy();
    expect(papers[0].relationshipType).toBeTruthy();
    expect(papers[0].isExternal).toBe(false);
  });

  it("produces structured comparison matrices and disagreement analysis", () => {
    const report = fallbackPaperComparison([
      {
        id: "paper-1",
        title: "Protocol v1",
        chunks: [
          {
            id: "c-1",
            documentId: "paper-1",
            versionId: "v-1",
            workspaceId: "demo-workspace",
            chunkIndex: 0,
            pageNumber: 1,
            content: "Initial dosing is established at 25mg administered twice daily with meals.",
            tokenCount: 15,
          },
        ],
      },
      {
        id: "paper-2",
        title: "Protocol v2",
        chunks: [
          {
            id: "c-2",
            documentId: "paper-2",
            versionId: "v-2",
            workspaceId: "demo-workspace",
            chunkIndex: 0,
            pageNumber: 1,
            content: "The initial dosing has been revised to 50mg once daily following tolerance findings.",
            tokenCount: 15,
          },
        ],
      },
    ]);

    expect(report.paperTitles).toContain("Protocol v1");
    expect(report.paperTitles).toContain("Protocol v2");
    expect(report.dimensionMatrix.length).toBeGreaterThan(0);
    expect(report.disagreements.length).toBeGreaterThan(0);
    expect(report.researchGaps.length).toBeGreaterThan(0);
  });
});
