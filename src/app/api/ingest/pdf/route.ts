import { NextRequest } from "next/server";
import { processDocumentUpload } from "@/lib/ingestion/document-processor";

export async function POST(req: NextRequest) {
  return processDocumentUpload(req);
}
