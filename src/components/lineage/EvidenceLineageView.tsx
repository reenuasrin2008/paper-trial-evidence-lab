"use client";

import React, { useState } from "react";
import { LineageGraph, LineageNode, LineageEdge } from "@/lib/rag/types";
import {
  GitCommit,
  GitBranch,
  Table,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  Search,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface EvidenceLineageViewProps {
  lineage: LineageGraph;
}

export function EvidenceLineageView({ lineage }: EvidenceLineageViewProps) {
  const [viewMode, setViewMode] = useState<"diagram" | "table">("diagram");
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  if (!lineage || lineage.nodes.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg p-8 text-center text-[#526A80]">
        <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No lineage traces available.</p>
        <p className="text-xs text-[#75808F] mt-1">Submit an inquiry to construct an interactive verifiable lineage graph.</p>
      </div>
    );
  }

  // Connected nodes calculation when a node is clicked
  const getConnectedNodeIds = (nodeId: string | null): Set<string> => {
    if (!nodeId) return new Set();
    const connected = new Set<string>([nodeId]);
    for (const edge of lineage.edges) {
      if (edge.source === nodeId) connected.add(edge.target);
      if (edge.target === nodeId) connected.add(edge.source);
    }
    return connected;
  };

  const connectedIds = getConnectedNodeIds(activeNodeId);

  // Group nodes by stage for structured linked diagram
  const questionNodes = lineage.nodes.filter((n) => n.type === "question");
  const chunkNodes = lineage.nodes.filter((n) => n.type === "chunk");
  const answerNodes = lineage.nodes.filter((n) => n.type === "answer");
  const claimNodes = lineage.nodes.filter((n) => n.type === "claim");
  const citationNodes = lineage.nodes.filter((n) => n.type === "citation");
  const assessmentNodes = lineage.nodes.filter((n) => n.type === "assessment");

  const getNodeColor = (node: LineageNode) => {
    switch (node.type) {
      case "question":
        return "border-[#17283B] bg-[#17283B] text-[#FFFFFF]";
      case "chunk":
        return "border-[#526A80] bg-[#E8EEF2] text-[#17283B]";
      case "answer":
        return "border-[#325070] bg-[#FCFCF9] text-[#17283B]";
      case "claim":
        return node.status === "supported"
          ? "border-[#347C70] bg-[#EBF5F3] text-[#347C70]"
          : node.status === "contradicted"
          ? "border-[#B65353] bg-[#FDF1F1] text-[#B65353]"
          : "border-[#B98237] bg-[#FDF7ED] text-[#B98237]";
      case "citation":
        return "border-[#526A80] bg-[#FFFFFF] text-[#252B33]";
      case "assessment":
        return "border-[#17283B] bg-[#FFFFFF] text-[#17283B]";
      default:
        return "border-[#D3DDE5] bg-[#FFFFFF] text-[#252B33]";
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-lg shadow-panel overflow-hidden">
      {/* Header bar */}
      <div className="bg-[#FCFCF9] border-b border-[#D3DDE5] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-[#17283B]" />
          <h3 className="font-editorial text-base font-bold text-[#17283B]">
            Evidence Lineage Graph
          </h3>
          <span className="text-xs text-[#526A80] font-sans">
            — Interactive End-to-End Trace Mapping
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-[#E8EEF2] p-0.5 rounded-md text-xs font-medium">
          <button
            onClick={() => setViewMode("diagram")}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === "diagram"
                ? "bg-[#FFFFFF] text-[#17283B] shadow-sm font-semibold"
                : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            Diagram View
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === "table"
                ? "bg-[#FFFFFF] text-[#17283B] shadow-sm font-semibold"
                : "text-[#526A80] hover:text-[#17283B]"
            }`}
          >
            Accessible Table View
          </button>
        </div>
      </div>

      {viewMode === "diagram" ? (
        <div className="p-6 overflow-x-auto bg-[#F7F6F2]/30">
          <div className="text-xs text-[#75808F] mb-4">
            Click on any node to trace upstream source dependencies and downstream claims.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-w-[840px]">
            {/* Stage 1: Question */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526A80]">
                1. User Inquiry
              </div>
              {questionNodes.map((node) => {
                const isFocused = activeNodeId === node.id || connectedIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                    className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${getNodeColor(
                      node
                    )} ${isFocused ? "ring-2 ring-[#17283B] shadow-md scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
                  >
                    <div className="font-semibold text-xs mb-1">{node.label}</div>
                    <p className="line-clamp-3 text-[11px] opacity-90">{node.title}</p>
                  </div>
                );
              })}
            </div>

            {/* Stage 2: Retrieved Chunks */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526A80]">
                2. Retrieved Chunks ({chunkNodes.length})
              </div>
              {chunkNodes.map((node) => {
                const isFocused = activeNodeId === node.id || connectedIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                    className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${getNodeColor(
                      node
                    )} ${isFocused ? "ring-2 ring-[#17283B] shadow-md scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
                  >
                    <div className="font-semibold text-xs mb-1">{node.label}</div>
                    <div className="text-[11px] font-medium text-[#17283B] truncate mb-1">
                      {node.title}
                    </div>
                    <p className="line-clamp-2 text-[10px] text-[#4E5763]">{node.details}</p>
                  </div>
                );
              })}
            </div>

            {/* Stage 3: Answer Synthesis */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526A80]">
                3. Synthesis
              </div>
              {answerNodes.map((node) => {
                const isFocused = activeNodeId === node.id || connectedIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                    className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${getNodeColor(
                      node
                    )} ${isFocused ? "ring-2 ring-[#17283B] shadow-md scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
                  >
                    <div className="font-semibold text-xs mb-1">{node.label}</div>
                    <p className="line-clamp-3 text-[11px] leading-relaxed">{node.title}</p>
                    <div className="mt-2 text-[10px] font-mono text-[#526A80]">{node.details}</div>
                  </div>
                );
              })}
            </div>

            {/* Stage 4: Decomposed Claims */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526A80]">
                4. Claims ({claimNodes.length})
              </div>
              {claimNodes.map((node) => {
                const isFocused = activeNodeId === node.id || connectedIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                    className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${getNodeColor(
                      node
                    )} ${isFocused ? "ring-2 ring-[#17283B] shadow-md scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{node.label}</span>
                      <span className="text-[10px] uppercase font-bold">{node.status}</span>
                    </div>
                    <p className="line-clamp-3 text-[11px] font-medium leading-relaxed">{node.title}</p>
                  </div>
                );
              })}
            </div>

            {/* Stage 5: Verifiable Citations */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526A80]">
                5. Citations & Passages
              </div>
              {citationNodes.map((node) => {
                const isFocused = activeNodeId === node.id || connectedIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                    className={`p-3 rounded-md border text-xs cursor-pointer transition-all ${getNodeColor(
                      node
                    )} ${isFocused ? "ring-2 ring-[#17283B] shadow-md scale-[1.02]" : "opacity-90 hover:opacity-100"}`}
                  >
                    <div className="font-semibold text-[11px] mb-1">{node.label}</div>
                    <p className="italic text-[10px] line-clamp-3 leading-relaxed mb-1">{node.title}</p>
                    <div className="text-[9px] text-[#75808F]">{node.details}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table View */
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D3DDE5] bg-[#F7F6F2] text-[#17283B]">
                <th className="py-2.5 px-3 font-semibold">Node Type</th>
                <th className="py-2.5 px-3 font-semibold">Label</th>
                <th className="py-2.5 px-3 font-semibold">Content / Assertion</th>
                <th className="py-2.5 px-3 font-semibold">Status / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF2]">
              {lineage.nodes.map((node) => (
                <tr key={node.id} className="hover:bg-[#F7F6F2]/50">
                  <td className="py-2.5 px-3 font-mono font-medium text-[#526A80] uppercase text-[10px]">
                    {node.type}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#17283B]">{node.label}</td>
                  <td className="py-2.5 px-3 text-[#252B33] max-w-md">{node.title}</td>
                  <td className="py-2.5 px-3 text-[#526A80]">{node.details || node.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
