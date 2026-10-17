// Evidence Reports Generator — JSON, CSV, and Printable HTML Exports

import { Claim, Citation, AbstentionType } from "../rag/types";

export interface EvidenceReportData {
  reportId: string;
  generatedAt: string;
  workspaceName: string;
  question: string;
  answer: string;
  abstentionType: AbstentionType;
  modelIdentifier: string;
  claims: Claim[];
  summaryMetrics: {
    totalClaims: number;
    supportedClaims: number;
    contradictedClaims: number;
    unresolvedClaims: number;
    supportRate: number;
  };
}

export function generateEvidenceReportJSON(data: EvidenceReportData): string {
  return JSON.stringify(data, null, 2);
}

export function generateEvidenceReportCSV(data: EvidenceReportData): string {
  const headers = [
    "Claim Order",
    "Claim Text",
    "Status",
    "Confidence",
    "Citation Exact Quote",
    "Source Document",
    "Page",
    "Citation Validated",
    "Assessment Rationale",
    "Evaluator",
  ];

  const rows: string[] = [headers.join(",")];

  for (const claim of data.claims) {
    if (claim.citations.length === 0) {
      rows.push(
        [
          claim.claimOrder,
          `"${claim.claimText.replace(/"/g, '""')}"`,
          claim.status,
          claim.confidence,
          '""',
          '""',
          '""',
          "FALSE",
          `"${(claim.assessment?.rationale || "").replace(/"/g, '""')}"`,
          claim.assessment?.evaluatorType || "automated",
        ].join(",")
      );
    } else {
      for (const cit of claim.citations) {
        rows.push(
          [
            claim.claimOrder,
            `"${claim.claimText.replace(/"/g, '""')}"`,
            claim.status,
            claim.confidence,
            `"${cit.exactQuote.replace(/"/g, '""')}"`,
            `"${(cit.documentTitle || "").replace(/"/g, '""')}"`,
            cit.pageNumber || 1,
            cit.isValidated ? "TRUE" : "FALSE",
            `"${(claim.assessment?.rationale || "").replace(/"/g, '""')}"`,
            claim.assessment?.evaluatorType || "automated",
          ].join(",")
        );
      }
    }
  }

  return rows.join("\n");
}

export function generateEvidenceReportHTML(data: EvidenceReportData): string {
  const claimsHtml = data.claims
    .map(
      (c) => `
    <div style="border: 1px solid #D3DDE5; border-radius: 6px; padding: 14px; margin-bottom: 14px; background: #FFFFFF;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
        <span style="font-weight: 600; font-size: 14px; color: #17283B;">Claim #${c.claimOrder}</span>
        <span style="padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${
          c.status === "supported"
            ? "#EBF5F3; color: #347C70;"
            : c.status === "contradicted"
            ? "#FDF1F1; color: #B65353;"
            : "#FDF7ED; color: #B98237;"
        }">${c.status}</span>
      </div>
      <p style="margin: 0 0 10px 0; color: #252B33; font-size: 14px; line-height: 1.5;">${c.claimText}</p>
      
      ${
        c.citations.length > 0
          ? `
        <div style="background: #F7F6F2; padding: 10px; border-left: 3px solid #526A80; font-size: 13px; color: #4E5763;">
          <div style="font-weight: 600; margin-bottom: 4px;">Verified Source Evidence:</div>
          ${c.citations
            .map(
              (cit) => `
            <div style="margin-bottom: 6px;">
              <em>"${cit.exactQuote}"</em>
              <div style="font-size: 11px; color: #75808F; margin-top: 2px;">Source: ${
                cit.documentTitle || "Document"
              } (Page ${cit.pageNumber}) — Match Status: ${
                cit.isValidated ? "Verified Substring" : "Flagged Mismatch"
              }</div>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : `<div style="font-size: 12px; color: #B98237;">⚠ No verifiable source passage cited for this claim.</div>`
      }
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PaperTrail Evidence Audit Report — ${data.reportId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F7F6F2; color: #252B33; margin: 0; padding: 40px; }
    .container { max-width: 840px; margin: 0 auto; background: #FFFFFF; padding: 36px; border: 1px solid #D3DDE5; border-radius: 8px; box-shadow: 0 2px 8px rgba(23,40,59,0.06); }
    h1 { color: #17283B; font-size: 24px; margin-top: 0; }
    .badge { font-family: monospace; font-size: 12px; color: #526A80; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .stat-card { background: #F7F6F2; padding: 12px; border-radius: 6px; text-align: center; }
    .stat-val { font-size: 20px; font-weight: 700; color: #17283B; }
    .stat-lbl { font-size: 11px; text-transform: uppercase; color: #75808F; }
  </style>
</head>
<body>
  <div class="container">
    <div style="border-bottom: 1px solid #D3DDE5; padding-bottom: 16px; margin-bottom: 24px;">
      <h1>PaperTrail Evidence Audit Report</h1>
      <div class="badge">Report ID: ${data.reportId} | Generated: ${data.generatedAt} | Model: ${data.modelIdentifier}</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-val">${data.summaryMetrics.totalClaims}</div><div class="stat-lbl">Claims</div></div>
      <div class="stat-card"><div class="stat-val" style="color: #347C70;">${data.summaryMetrics.supportedClaims}</div><div class="stat-lbl">Supported</div></div>
      <div class="stat-card"><div class="stat-val" style="color: #B65353;">${data.summaryMetrics.contradictedClaims}</div><div class="stat-lbl">Contradicted</div></div>
      <div class="stat-card"><div class="stat-val" style="color: #B98237;">${data.summaryMetrics.unresolvedClaims}</div><div class="stat-lbl">Unresolved</div></div>
    </div>

    <h3>Inquiry</h3>
    <div style="background: #E8EEF2; padding: 14px; border-radius: 6px; font-weight: 500; margin-bottom: 24px;">
      ${data.question}
    </div>

    <h3>Grounded Synthesis</h3>
    <p style="line-height: 1.6; font-size: 15px; margin-bottom: 30px;">
      ${data.answer}
    </p>

    <h3>Claim-Level Evidence Inspection (Evidence Lens)</h3>
    ${claimsHtml}

    <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #D3DDE5; font-size: 11px; color: #75808F; text-align: center;">
      Generated by PaperTrail Evidence Lab. Automated assessments are fallible and require human verification.
    </div>
  </div>
</body>
</html>
  `;
}
