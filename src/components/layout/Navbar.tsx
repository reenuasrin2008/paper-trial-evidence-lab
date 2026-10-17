"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  BookOpen,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Microscope,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [contradictionCount, setContradictionCount] = useState(1);

  const navItems = [
    { href: "/", label: "Overview", icon: Layers },
    { href: "/workspace/student", label: "Student", icon: BookOpen },
    { href: "/workspace/developer", label: "Developer", icon: Terminal },
    { href: "/workspace/researcher", label: "Researcher", icon: Microscope },
    { href: "/workspace/business", label: "Business", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FCFCF9]/95 backdrop-blur-md border-b border-[#D3DDE5] shadow-editorial">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <NextLink href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded bg-[#17283B] flex items-center justify-center text-[#F7F6F2] font-editorial text-lg font-bold shadow-sm group-hover:bg-[#223B56] transition-colors">
                PT
              </div>
              <div className="flex flex-col">
                <span className="font-editorial text-lg font-bold text-[#17283B] leading-tight tracking-tight">
                  PaperTrail
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-[#526A80]">
                  Evidence Lab
                </span>
              </div>
            </NextLink>
          </div>

          {/* Workspace Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#17283B] text-[#F7F6F2] shadow-sm"
                      : "text-[#526A80] hover:text-[#17283B] hover:bg-[#E8EEF2]/60"
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>

          {/* Right Status Badges */}
          <div className="flex items-center space-x-3">
            {/* Contradiction Counter Pill */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#FDF7ED] border border-[#B98237]/30 text-[#B98237] text-xs font-semibold"
              title="1 Unreviewed Contradiction Candidate"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>1 Conflict</span>
            </div>

            {/* Provider Connectivity Indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#EBF5F3] border border-[#347C70]/30 text-[#347C70] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#347C70] animate-pulse"></span>
              <span>Gemini + Vector RAG Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
