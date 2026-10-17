import { NextRequest, NextResponse } from "next/server";
import { globalBusinessService } from "@/lib/business/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      claimId,
      workspaceId = "demo-workspace",
      feedbackType,
      correctedStatus,
      notes,
    } = body;

    if (!claimId || !feedbackType) {
      return NextResponse.json({ error: "Missing claimId or feedbackType" }, { status: 400 });
    }

    // Record human review in audit trail
    globalBusinessService.recordEvent({
      workspaceId,
      action: "human_claim_feedback_submitted",
      targetType: "claim",
      metadata: {
        claimId,
        feedbackType,
        correctedStatus,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Human review recorded. Verification trail updated.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
