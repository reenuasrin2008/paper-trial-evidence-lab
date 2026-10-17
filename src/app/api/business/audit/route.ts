import { NextRequest, NextResponse } from "next/server";
import { globalBusinessService } from "@/lib/business/audit-logger";
import { globalImpactTracker } from "@/lib/analysis/impact-tracker";
import { initializeDemoWorkspace } from "@/lib/store/demo-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || "demo-workspace";

  await initializeDemoWorkspace(workspaceId);

  const events = globalBusinessService.getAuditEvents(workspaceId);
  const collections = globalBusinessService.getCollections(workspaceId);
  const impactLinks = globalImpactTracker.getImpactLinksForWorkspace(workspaceId);

  return NextResponse.json({
    events,
    collections,
    impactLinks,
  });
}
