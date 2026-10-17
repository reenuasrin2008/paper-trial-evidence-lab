import { NextRequest, NextResponse } from "next/server";
import { fetchScholarlyPublications } from "@/lib/research/scholarly-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query = "", paperTitle = "", abstract = "" } = body;

    const searchTerm = query || paperTitle;
    if (!searchTerm) {
      return NextResponse.json(
        { error: "Provide either a search query or a paper title" },
        { status: 400 }
      );
    }

    const papers = await fetchScholarlyPublications(searchTerm, paperTitle, abstract);

    return NextResponse.json({
      query: searchTerm,
      source: papers.some((p) => p.isExternal) ? "OpenAlex Scholarly API" : "Workspace Research Library",
      totalFound: papers.length,
      papers,
    });
  } catch (error) {
    console.error("Scholarly discovery API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to search scholarly publications" },
      { status: 500 }
    );
  }
}
