import { describe, it, expect } from "vitest";
import { fallbackVersionDiff } from "../src/lib/analysis/version-diff";

describe("Document Versioning & Change Impact Engine", () => {
  it("computes added, removed, and modified passages between versions", () => {
    const diff = fallbackVersionDiff(
      "doc-clinical-v1",
      "Phase III Clinical Protocol",
      1,
      2
    );

    expect(diff.docId).toBe("doc-clinical-v1");
    expect(diff.versionA).toBe(1);
    expect(diff.versionB).toBe(2);
    expect(diff.addedPassages.length).toBeGreaterThan(0);
    expect(diff.removedPassages.length).toBeGreaterThan(0);
    expect(diff.modifiedPassages.length).toBeGreaterThan(0);
  });

  it("identifies invalidated downstream claims when material numbers change", () => {
    const diff = fallbackVersionDiff(
      "doc-clinical-v1",
      "Phase III Clinical Protocol",
      1,
      2
    );

    const invalidated = diff.affectedClaims.filter((c) => c.risk === "invalidated");
    expect(invalidated.length).toBeGreaterThan(0);
    expect(invalidated[0].reason).toBeTruthy();
  });
});
