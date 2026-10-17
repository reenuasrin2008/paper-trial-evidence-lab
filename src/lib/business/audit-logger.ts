// Business Workspace — Privacy-Safe Audit Logger & Document Collections

import { AuditEvent } from "../rag/types";

export interface DocumentCollection {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class BusinessAuditService {
  private auditEvents: AuditEvent[] = [];
  private collections: Map<string, DocumentCollection> = new Map();

  recordEvent(event: Omit<AuditEvent, "id" | "createdAt">): AuditEvent {
    const fullEvent: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...event,
    };
    this.auditEvents.unshift(fullEvent);
    return fullEvent;
  }

  getAuditEvents(workspaceId: string, limit = 50): AuditEvent[] {
    return this.auditEvents
      .filter((e) => e.workspaceId === workspaceId)
      .slice(0, limit);
  }

  createCollection(collection: Omit<DocumentCollection, "id" | "createdAt" | "updatedAt">): DocumentCollection {
    const id = `col-${Date.now()}`;
    const full: DocumentCollection = {
      ...collection,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.collections.set(id, full);

    this.recordEvent({
      workspaceId: collection.workspaceId,
      action: "collection_created",
      targetType: "collection",
      targetId: id,
      metadata: { collectionName: collection.name, documentCount: collection.documentIds.length },
    });

    return full;
  }

  getCollections(workspaceId: string): DocumentCollection[] {
    return Array.from(this.collections.values()).filter(
      (c) => c.workspaceId === workspaceId
    );
  }
}

export const globalBusinessService = new BusinessAuditService();
