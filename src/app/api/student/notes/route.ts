import { NextRequest, NextResponse } from "next/server";
import { globalStudentService } from "@/lib/student/study-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || "demo-workspace";
  const notes = globalStudentService.getNotes(workspaceId);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId = "demo-workspace", title, content, sourceDocumentTitle, sourcePage, exactQuote } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }

    const note = {
      id: `note-${Date.now()}`,
      workspaceId,
      userId: "user-current",
      title,
      content,
      sourceDocumentTitle,
      sourcePage,
      exactQuote,
      createdAt: new Date().toISOString(),
    };

    globalStudentService.saveNote(note);
    return NextResponse.json({ success: true, note });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
