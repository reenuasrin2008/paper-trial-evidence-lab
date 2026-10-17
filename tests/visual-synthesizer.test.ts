import { describe, it, expect } from "vitest";
import {
  detectPreferredVisualType,
  fallbackVisualSynthesis,
} from "../src/lib/analysis/visual-synthesizer";

describe("Universal Visual Answering Engine", () => {
  it("correctly detects visual type based on question intent", () => {
    expect(detectPreferredVisualType("Show this workflow as a flowchart")).toBe("flowchart");
    expect(detectPreferredVisualType("Explain this architecture visually")).toBe("architecture");
    expect(detectPreferredVisualType("Show the request and response sequence")).toBe("sequence");
    expect(detectPreferredVisualType("What happened over time and the timeline?")).toBe("timeline");
    expect(detectPreferredVisualType("Compare these two methods in a table")).toBe("comparison_table");
    expect(detectPreferredVisualType("What are the reported metric statistics and charts?")).toBe("chart");
    expect(detectPreferredVisualType("What decision tree should we follow?")).toBe("decision_tree");
    expect(detectPreferredVisualType("Create a concept map of key ideas")).toBe("concept_map");
  });

  it("synthesizes fallback visual data strictly grounded in context passages", () => {
    const context = [
      {
        id: "chunk-1",
        documentTitle: "Clinical Trial Protocol",
        pageNumber: 1,
        content: "Initial dosing is established at 25mg twice daily. Cohort includes 450 patients.",
      },
    ];

    const answer = "Patients receive 25mg twice daily. The cohort is comprised of 450 subjects across 12 centers.";
    const visual = fallbackVisualSynthesis("Show process as flowchart", answer, context, "flowchart");

    expect(visual.type).toBe("flowchart");
    expect(visual.nodes.length).toBeGreaterThan(0);
    expect(visual.nodes[0].isReported).toBe(true);
    expect(visual.textAlternative).toBeTruthy();
    expect(visual.reportedVsInferred).toBe("reported_fact");
  });
});
