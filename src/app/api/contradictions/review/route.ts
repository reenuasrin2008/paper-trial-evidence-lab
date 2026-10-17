import { NextRequest, NextResponse } from "next/server";
import { globalContradictionService } from "@/lib/analysis/contradiction";
import { globalBusinessService } from "@/lib/business/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, status, reviewerName = "Human Reviewer", notes } = body;

    if (!candidateId || !status) {
      return NextResponse.json({ error: "Missing candidateId or status" }, { status: 400 });
    }

    const updated = globalContradictionService.updateReviewStatus(
      candidateId,
      status,
      reviewerName,
      notes
    );

    if (!updated) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Record audit event
    globalBusinessService.recordEvent({
      workspaceId: updated.workspaceId,
      action: "contradiction_review_updated",
      targetType: "contradiction_candidate",
      targetId: updated.id,
      metadata: { status, reviewerName, notes },
    });

    return NextResponse.json({ success: true, candidate: updated });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
