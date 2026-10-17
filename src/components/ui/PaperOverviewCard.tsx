"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Microscope,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
} from "lucide-react";

export interface PaperOverview {
  title: string;
  summary: string;
  researchQuestion: string;
  methodology: string;
  keyFindings: string[];
  limitations: string[];
  assumptions: string[];
  potentialWeaknesses: string[];
  totalChunks: number;
  totalPages: number;
}

interface PaperOverviewCardProps {
  overview: PaperOverview;
  isLoading?: boolean;
}

function ExpandableSection({
  title,
  icon: Icon,
  color,
  items,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  items: string[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#D3DDE5] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#FCFCF9] hover:bg-[#F7F6F2] transition-colors text-left"
      >
        <div className="flex items-center space-x-2.5">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#17283B]">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8EEF2] text-[#526A80] font-semibold">
            {items.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#75808F]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#75808F]" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 bg-white space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2.5">
              <span className="w-4 h-4 rounded-full border border-[#D3DDE5] flex items-center justify-center text-[9px] font-bold text-[#526A80] flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs text-[#252B33] leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PaperOverviewCard({ overview, isLoading }: PaperOverviewCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl p-6 shadow-editorial animate-pulse space-y-4">
        <div className="h-4 bg-[#E8EEF2] rounded w-3/4" />
        <div className="h-3 bg-[#E8EEF2] rounded w-full" />
        <div className="h-3 bg-[#E8EEF2] rounded w-5/6" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#E8EEF2] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#D3DDE5] rounded-xl shadow-editorial overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#E8EEF2]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <FileText className="w-4 h-4 text-[#347C70] flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#347C70]">
                Paper Overview
              </span>
            </div>
            <h2 className="font-editorial text-lg font-bold text-[#17283B] leading-tight">
              {overview.title}
            </h2>
          </div>
          <div className="flex flex-col items-end space-y-1 text-right flex-shrink-0">
            <div className="flex items-center space-x-1 text-[10px] text-[#75808F]">
              <Layers className="w-3 h-3" />
              <span>{overview.totalChunks} passages indexed</span>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-[#75808F]">
              <BookOpen className="w-3 h-3" />
              <span>{overview.totalPages} pages</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="bg-[#FCFCF9] rounded-lg p-4 border border-[#E8EEF2]">
          <p className="font-serif text-sm text-[#17283B] leading-relaxed">{overview.summary}</p>
        </div>

        {/* Research Question */}
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#E8EEF2]/50">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[#17283B] flex-shrink-0 mt-0.5">
            <HelpCircle className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#526A80] mb-1">
              Research Question
            </div>
            <p className="text-xs text-[#252B33] leading-relaxed">{overview.researchQuestion}</p>
          </div>
        </div>

        {/* Methodology */}
        <div className="flex items-start space-x-3 p-3 rounded-lg bg-[#EBF5F3]/50">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-[#347C70] flex-shrink-0 mt-0.5">
            <Microscope className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#347C70] mb-1">
              Methodology
            </div>
            <p className="text-xs text-[#252B33] leading-relaxed">{overview.methodology}</p>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-2">
          <ExpandableSection
            title="Key Findings"
            icon={Lightbulb}
            color="bg-[#FDF7ED] text-[#B98237]"
            items={overview.keyFindings}
            defaultOpen={true}
          />
          <ExpandableSection
            title="Limitations"
            icon={AlertTriangle}
            color="bg-[#FDF1F1] text-[#B65353]"
            items={overview.limitations}
          />
          <ExpandableSection
            title="Assumptions"
            icon={HelpCircle}
            color="bg-[#E8EEF2] text-[#526A80]"
            items={overview.assumptions}
          />
          <ExpandableSection
            title="Potential Weaknesses"
            icon={AlertTriangle}
            color="bg-[#FDF7ED] text-[#B98237]"
            items={overview.potentialWeaknesses}
          />
        </div>
      </div>
    </div>
  );
}
