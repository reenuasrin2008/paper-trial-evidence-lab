import { describe, it, expect } from "vitest";
import { ImpactTrackerService } from "../src/lib/analysis/impact-tracker";

describe("Document Versioning & Change Impact Tracking", () => {
  it("flags downstream dependent claims as needs_review upon new version release", () => {
    const service = new ImpactTrackerService();

    service.recordImpactLink({
      id: "link-1",
      workspaceId: "ws-1",
      documentId: "doc-clinical",
      documentTitle: "Clinical Protocol",
      versionId: "ver-1",
      versionNumber: 1,
      impactedType: "answer_claim",
      impactedId: "claim-100",
      impactedTitle: "Patient Dosage Claim",
      status: "up_to_date",
      changeSummary: "Initial version",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const affected = service.registerDocumentVersionChange(
      "ws-1",
      "doc-clinical",
      "Clinical Protocol",
      "ver-2",
      2,
      "Dosing increased to 50mg"
    );

    expect(affected.length).toBe(1);
    expect(affected[0].status).toBe("needs_review");
    expect(affected[0].changeSummary).toContain("updated to v2");

    const needsReview = service.getNeedsReviewLinks("ws-1");
    expect(needsReview.length).toBe(1);

    // Verify reverification
    const reverified = service.markReverified("link-1");
    expect(reverified?.status).toBe("reverified");
    expect(service.getNeedsReviewLinks("ws-1").length).toBe(0);
  });
});
