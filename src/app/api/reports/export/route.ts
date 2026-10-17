import { NextRequest, NextResponse } from "next/server";
import {
  generateEvidenceReportJSON,
  generateEvidenceReportCSV,
  generateEvidenceReportHTML,
  EvidenceReportData,
} from "@/lib/reports/report-generator";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const reportData: EvidenceReportData = await req.json();

    if (!reportData || !reportData.question) {
      return NextResponse.json({ error: "Invalid report payload" }, { status: 400 });
    }

    if (format === "csv") {
      const csv = generateEvidenceReportCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="evidence-report-${reportData.reportId}.csv"`,
        },
      });
    }

    if (format === "html") {
      const html = generateEvidenceReportHTML(reportData);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="evidence-report-${reportData.reportId}.html"`,
        },
      });
    }

    const json = generateEvidenceReportJSON(reportData);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="evidence-report-${reportData.reportId}.json"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
