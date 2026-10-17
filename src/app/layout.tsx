import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "PaperTrail Evidence Lab — Evidence-First Document Intelligence & RAG Reliability",
  description:
    "Trace every answer to verifiable source passages. Detect unsubstantiated claims, citation mismatches, conflicting documents, and RAG regressions.",
  keywords: [
    "RAG Reliability",
    "Evidence Grounding",
    "Citation Verification",
    "Hallucination Detection",
    "Document Intelligence",
    "AI Safety",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#252B33]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-[#D3DDE5] bg-[#FCFCF9] py-8 text-xs text-[#526A80]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-editorial font-bold text-[#17283B]">PaperTrail Evidence Lab</span>
              <span>— Verifiable Document Intelligence Engine</span>
            </div>
            <div className="flex items-center space-x-6 text-[11px] text-[#75808F]">
              <span>AES-256 Storage</span>
              <span>Isolated Workspace RLS</span>
              <span>Zero Untrusted Model Retraining</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
