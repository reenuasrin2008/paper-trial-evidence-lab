// Document Versioning and Downstream Change Impact Tracker

import { DocumentImpactLink } from "../rag/types";

export class ImpactTrackerService {
  private impactLinks: Map<string, DocumentImpactLink> = new Map();

  recordImpactLink(link: DocumentImpactLink): void {
    this.impactLinks.set(link.id, link);
  }

  getImpactLinksForWorkspace(workspaceId: string): DocumentImpactLink[] {
    return Array.from(this.impactLinks.values()).filter(
      (l) => l.workspaceId === workspaceId
    );
  }

  getNeedsReviewLinks(workspaceId: string): DocumentImpactLink[] {
    return this.getImpactLinksForWorkspace(workspaceId).filter(
      (l) => l.status === "needs_review"
    );
  }

  registerDocumentVersionChange(
    workspaceId: string,
    documentId: string,
    documentTitle: string,
    newVersionId: string,
    newVersionNumber: number,
    changeSummary: string
  ): DocumentImpactLink[] {
    // Find all links referencing earlier versions of this document
    const affected = Array.from(this.impactLinks.values()).filter(
      (l) => l.documentId === documentId && l.status !== "stale"
    );

    const newlyFlagged: DocumentImpactLink[] = [];

    for (const item of affected) {
      item.status = "needs_review";
      item.changeSummary = `Document updated to v${newVersionNumber}: ${changeSummary}`;
      item.updatedAt = new Date().toISOString();
      newlyFlagged.push(item);
    }

    return newlyFlagged;
  }

  markReverified(linkId: string): DocumentImpactLink | undefined {
    const link = this.impactLinks.get(linkId);
    if (link) {
      link.status = "reverified";
      link.updatedAt = new Date().toISOString();
    }
    return link;
  }
}

export const globalImpactTracker = new ImpactTrackerService();
