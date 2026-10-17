"use client";

import React, { useState } from "react";
import {
  GitMerge,
  Network,
  Cpu,
  Layers,
  Clock,
  Table as TableIcon,
  BarChart3,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  FileText,
  Download,
  Eye,
  AlignLeft,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  VisualExplanation,
  VisualExplanationType,
  VisualExplanationNode,
} from "@/lib/rag/types";

interface VisualAnswerRendererProps {
  visual: VisualExplanation;
  onSelectCitation?: (quote: string, page?: number) => void;
}

export function VisualAnswerRenderer({
  visual,
  onSelectCitation,
}: VisualAnswerRendererProps) {
  const [selectedNode, setSelectedNode] = useState<VisualExplanationNode | null>(
    visual.nodes && visual.nodes.length > 0 ? visual.nodes[0] : null
  );
  const [viewMode, setViewMode] = useState<"diagram" | "text">("diagram");
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const getIconForType = (type: VisualExplanationType) => {
    switch (type) {
      case "flowchart":
        return GitMerge;
      case "concept_map":
        return Network;
      case "architecture":
        return Cpu;
      case "sequence":
        return Layers;
      case "timeline":
        return Clock;
      case "comparison_table":
        return TableIcon;
      case "chart":
        return BarChart3;
      case "decision_tree":
        return GitFork;
      default:
        return GitMerge;
    }
  };

  const IconComponent = getIconForType(visual.type);

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(visual, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `papertrail-visual-${visual.type}-${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl shadow-editorial overflow-hidden">
      {/* Visual Header */}
      <div className="px-5 py-4 border-b border-[#E8EEF2] bg-[#FCFCF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#17283B] flex items-center justify-center text-white flex-shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#347C70]">
                Interactive Visual Explanation
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-white text-[#526A80] border-[#D3DDE5]">
                {visual.type.replace("_", " ")}
              </span>
              {visual.reportedVsInferred === "reported_fact" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EBF5F3] text-[#347C70] border border-[#347C70]/30">
                  100% Document Grounded
                </span>
              )}
            </div>
            <h3 className="font-editorial text-base font-bold text-[#17283B] mt-0.5">
              {visual.title}
            </h3>
          </div>
        </div>

        {/* Controls: Switch View & Export */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg border border-[#D3DDE5] p-0.5 bg-[#E8EEF2]">
            <button
              onClick={() => setViewMode("diagram")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 transition-colors ${
                viewMode === "diagram"
                  ? "bg-white text-[#17283B] shadow-sm"
                  : "text-[#526A80] hover:text-[#17283B]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              onClick={() => setViewMode("text")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center space-x-1 transition-colors ${
                viewMode === "text"
                  ? "bg-white text-[#17283B] shadow-sm"
                  : "text-[#526A80] hover:text-[#17283B]"
              }`}
              title="Accessible Text Alternative"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Accessible Text</span>
            </button>
          </div>

          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded-md border border-[#D3DDE5] bg-white text-[#526A80] hover:text-[#17283B] hover:bg-[#FCFCF9] transition-colors"
            title="Export Diagram Data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description & Limitation Banner */}
      <div className="px-5 py-2.5 bg-[#F7F6F2] border-b border-[#E8EEF2] flex items-center justify-between text-xs text-[#526A80]">
        <p className="line-clamp-1">{visual.description}</p>
        {visual.limitationNote && (
          <span
            className="inline-flex items-center space-x-1 text-[11px] text-[#B98237] font-medium ml-2 flex-shrink-0"
            title={visual.limitationNote}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Limited source context</span>
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5">
        {viewMode === "text" ? (
          /* Accessible Text View */
          <div className="space-y-4 max-w-3xl">
            <div className="bg-[#FCFCF9] border border-[#D3DDE5] rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#526A80]">
                Accessible Text Representation
              </h4>
              <p className="font-serif text-sm text-[#17283B] leading-relaxed">
                {visual.textAlternative}
              </p>
            </div>

            {visual.nodes && visual.nodes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#526A80]">
                  Document Passages & Node Citations
                </h4>
                <div className="space-y-2">
                  {visual.nodes.map((node, i) => (
                    <div
                      key={node.id}
                      className="p-3 border border-[#E8EEF2] rounded-md bg-white text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#17283B]">
                          {i + 1}. {node.label}
                        </span>
                        {node.pageNumber && (
                          <span className="text-[10px] text-[#526A80]">
                            Page {node.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[#526A80]">{node.description}</p>
                      {node.sourceQuote && (
                        <blockquote className="border-l-2 border-[#347C70] pl-2 text-[11px] italic text-[#17283B]">
                          &ldquo;{node.sourceQuote}&rdquo;
                        </blockquote>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Interactive Visual Diagrams */
          <div className="space-y-6">
            {/* 1. Comparison Table */}
            {visual.type === "comparison_table" && visual.tableData && (
              <div className="overflow-x-auto border border-[#D3DDE5] rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#FCFCF9] border-b border-[#D3DDE5] text-[#17283B] font-bold">
                    <tr>
                      {visual.tableData.headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 border-r border-[#E8EEF2] last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF2]">
                    {visual.tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#FCFCF9]/70 transition-colors">
                        {visual.tableData?.headers.map((h, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-4 py-3 border-r border-[#E8EEF2] last:border-r-0 text-[#252B33]"
                          >
                            {row[h] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Chart (SVG Bar Chart based on reported numbers) */}
            {visual.type === "chart" && visual.chartData && (
              <div className="space-y-4">
                <div className="bg-[#FCFCF9] border border-[#D3DDE5] rounded-xl p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#526A80] mb-4">
                    Reported Quantitative Findings ({visual.chartData.datasets[0]?.unit || "Values"})
                  </div>
                  <div className="space-y-3">
                    {visual.chartData.labels.map((label, idx) => {
                      const value = visual.chartData?.datasets[0]?.data[idx] || 0;
                      const maxVal = Math.max(...(visual.chartData?.datasets[0]?.data || [100]));
                      const pct = Math.min(100, Math.max(10, (value / maxVal) * 100));
                      const isHovered = activeBarIndex === idx;

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveBarIndex(idx)}
                          onMouseLeave={() => setActiveBarIndex(null)}
                          className="space-y-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#17283B]">{label}</span>
                            <span className="font-mono font-bold text-[#347C70]">
                              {value} {visual.chartData?.datasets[0]?.unit || ""}
                            </span>
                          </div>
                          <div className="w-full h-5 bg-[#E8EEF2] rounded-md overflow-hidden relative">
                            <div
                              className={`h-full transition-all duration-500 rounded-md ${
                                isHovered ? "bg-[#347C70]" : "bg-[#17283B]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {visual.chartData.sourceQuote && (
                    <div className="mt-4 pt-3 border-t border-[#E8EEF2] text-[11px] text-[#526A80] italic">
                      Reported Quote: &ldquo;{visual.chartData.sourceQuote}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Timeline */}
            {visual.type === "timeline" && visual.timelineEvents && (
              <div className="relative border-l-2 border-[#17283B] ml-4 pl-6 space-y-6">
                {visual.timelineEvents.map((evt, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#17283B] border-2 border-white ring-2 ring-[#D3DDE5] group-hover:bg-[#347C70] transition-colors" />
                    <div className="bg-[#FCFCF9] border border-[#D3DDE5] rounded-lg p-4 space-y-1 hover:border-[#17283B] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#347C70]">
                          {evt.date}
                        </span>
                        {evt.pageNumber && (
                          <span className="text-[10px] text-[#75808F]">
                            Page {evt.pageNumber}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-[#17283B]">{evt.title}</h4>
                      <p className="text-xs text-[#526A80] leading-relaxed">
                        {evt.description}
                      </p>
                      {evt.sourceQuote && (
                        <blockquote className="mt-2 text-[11px] italic text-[#17283B] border-l border-[#347C70] pl-2">
                          &ldquo;{evt.sourceQuote}&rdquo;
                        </blockquote>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Flowchart / Architecture / Concept Map / Sequence / Decision Tree */}
            {visual.type !== "comparison_table" &&
              visual.type !== "chart" &&
              visual.type !== "timeline" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Interactive Diagram Canvas */}
                  <div className="lg:col-span-7 bg-[#FCFCF9] border border-[#D3DDE5] rounded-xl p-5 overflow-x-auto min-h-[320px] flex flex-col justify-center">
                    <div className="space-y-4">
                      {visual.nodes.map((node, idx) => {
                        const isSelected = selectedNode?.id === node.id;
                        const edge = visual.edges?.find((e) => e.from === node.id);

                        return (
                          <div key={node.id} className="space-y-2">
                            <button
                              onClick={() => setSelectedNode(node)}
                              className={`w-full text-left p-4 rounded-xl border transition-all text-xs ${
                                isSelected
                                  ? "bg-white border-[#17283B] shadow-md ring-2 ring-[#17283B]/20"
                                  : "bg-white/80 border-[#D3DDE5] hover:border-[#526A80] hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="w-5 h-5 rounded-full bg-[#17283B] text-white flex items-center justify-center text-[10px] font-bold">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-[#17283B]">
                                    {node.label}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    node.isReported !== false
                                      ? "bg-[#EBF5F3] text-[#347C70]"
                                      : "bg-[#FDF7ED] text-[#B98237]"
                                  }`}
                                >
                                  {node.isReported !== false ? "Reported" : "Inferred"}
                                </span>
                              </div>
                              <p className="text-xs text-[#526A80] line-clamp-2">
                                {node.description}
                              </p>
                              {node.metrics && (
                                <div className="mt-2 text-[11px] font-mono font-semibold text-[#347C70]">
                                  {node.metrics}
                                </div>
                              )}
                            </button>

                            {/* Edge / Transition indicator */}
                            {edge && idx < visual.nodes.length - 1 && (
                              <div className="flex items-center justify-center space-x-2 py-1 text-[11px] text-[#526A80] font-medium">
                                <ArrowRight className="w-3.5 h-3.5 rotate-90 text-[#75808F]" />
                                {edge.label && (
                                  <span className="bg-[#E8EEF2] px-2 py-0.5 rounded text-[10px] text-[#17283B]">
                                    {edge.label}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contextual Node Inspection Panel */}
                  <div className="lg:col-span-5 bg-white border border-[#D3DDE5] rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8EEF2] pb-3">
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-[#17283B]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#17283B]">
                          Node Context & Citation
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#75808F]">Click any node</span>
                    </div>

                    {selectedNode ? (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                selectedNode.isReported !== false
                                  ? "bg-[#EBF5F3] text-[#347C70]"
                                  : "bg-[#FDF7ED] text-[#B98237]"
                              }`}
                            >
                              {selectedNode.isReported !== false
                                ? "Reported Fact"
                                : "Analytical Deduction"}
                            </span>
                            {selectedNode.type && (
                              <span className="text-[10px] font-mono text-[#75808F]">
                                [{selectedNode.type}]
                              </span>
                            )}
                          </div>
                          <h4 className="font-editorial text-base font-bold text-[#17283B]">
                            {selectedNode.label}
                          </h4>
                          <p className="text-xs text-[#252B33] leading-relaxed mt-1">
                            {selectedNode.description}
                          </p>
                        </div>

                        {selectedNode.sourceQuote ? (
                          <div className="bg-[#FCFCF9] border border-[#D3DDE5] rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#526A80]">
                              <span>Verbatim Source Citation</span>
                              {selectedNode.pageNumber && (
                                <span>Page {selectedNode.pageNumber}</span>
                              )}
                            </div>
                            <blockquote className="font-serif text-xs italic text-[#17283B] leading-relaxed border-l-2 border-[#347C70] pl-2.5">
                              &ldquo;{selectedNode.sourceQuote}&rdquo;
                            </blockquote>
                            {selectedNode.documentTitle && (
                              <div className="text-[10px] text-[#75808F]">
                                Source: {selectedNode.documentTitle}
                              </div>
                            )}
                            {onSelectCitation && (
                              <button
                                onClick={() =>
                                  onSelectCitation(
                                    selectedNode.sourceQuote || "",
                                    selectedNode.pageNumber
                                  )
                                }
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#347C70] hover:underline pt-1"
                              >
                                <span>Inspect in Source Passages</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-[#75808F] italic p-3 bg-[#F7F6F2] rounded">
                            Inferred node derived from surrounding process logic.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-xs text-[#75808F]">
                        Select a component or step on the left to view evidence grounding.
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
