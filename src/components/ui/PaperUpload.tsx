"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  BookOpen,
} from "lucide-react";

export interface UploadedPaper {
  documentId: string;
  versionId: string;
  title: string;
  workspaceId: string;
  totalPages: number;
  totalChunks: number;
}

interface PaperUploadProps {
  workspaceId?: string;
  onUploadSuccess: (paper: UploadedPaper) => void;
  onUploadError?: (error: string) => void;
  compact?: boolean;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function PaperUpload({
  workspaceId = "demo-workspace",
  onUploadSuccess,
  onUploadError,
  compact = false,
}: PaperUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setUploadState("idle");
    setProgress(0);
    setErrorMessage("");
    setUploadedFile(null);
    setCustomTitle("");
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMessage("Only PDF files are supported. Please upload a .pdf file.");
        setUploadState("error");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("File exceeds 10 MB. Please compress or split the PDF.");
        setUploadState("error");
        return;
      }

      setUploadedFile(file);
      setUploadState("uploading");
      setProgress(10);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 8, 85));
      }, 400);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceId", workspaceId);
        if (customTitle) formData.append("title", customTitle);

        const res = await fetch("/api/ingest/pdf", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(95);

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setProgress(100);
        setUploadState("success");
        onUploadSuccess(data as UploadedPaper);
      } catch (err) {
        clearInterval(progressInterval);
        const msg = (err as Error).message || "Upload failed. Please try again.";
        setErrorMessage(msg);
        setUploadState("error");
        onUploadError?.(msg);
      }
    },
    [workspaceId, customTitle, onUploadSuccess, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setUploadState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("dragging");
  };

  const handleDragLeave = () => {
    if (uploadState === "dragging") setUploadState("idle");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (compact) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => uploadState === "idle" && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
          uploadState === "dragging"
            ? "border-[#347C70] bg-[#EBF5F3]"
            : uploadState === "success"
            ? "border-[#347C70] bg-[#EBF5F3] cursor-default"
            : uploadState === "error"
            ? "border-[#B65353] bg-[#FDF1F1]"
            : "border-[#D3DDE5] hover:border-[#17283B] hover:bg-[#F7F6F2]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileInput}
        />
        {uploadState === "idle" || uploadState === "dragging" ? (
          <div className="flex items-center space-x-3 text-xs">
            <Upload className="w-4 h-4 text-[#526A80] flex-shrink-0" />
            <span className="text-[#526A80]">
              {uploadState === "dragging" ? "Drop PDF to upload" : "Drop PDF or click to browse"}
            </span>
          </div>
        ) : uploadState === "uploading" ? (
          <div className="flex items-center space-x-3">
            <Loader2 className="w-4 h-4 text-[#526A80] animate-spin flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-[#526A80] mb-1">Processing {uploadedFile?.name}…</div>
              <div className="h-1 bg-[#E8EEF2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#347C70] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : uploadState === "success" ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#347C70] flex-shrink-0" />
              <span className="text-xs text-[#347C70] font-semibold">Indexed successfully</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); resetState(); }}
              className="text-xs text-[#526A80] hover:text-[#17283B]"
            >
              Upload another
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#B65353] flex-shrink-0" />
              <span className="text-xs text-[#B65353]">{errorMessage}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); resetState(); }}
              className="text-xs text-[#526A80] hover:text-[#17283B]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Optional title override */}
      {uploadState === "idle" && (
        <input
          type="text"
          placeholder="Custom paper title (optional — uses filename by default)"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          className="w-full text-sm px-4 py-2.5 bg-[#FCFCF9] border border-[#D3DDE5] rounded-md focus:border-[#17283B] focus:ring-1 focus:ring-[#17283B] outline-none"
        />
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() =>
          (uploadState === "idle" || uploadState === "error") && fileInputRef.current?.click()
        }
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
          uploadState === "dragging"
            ? "border-[#347C70] bg-[#EBF5F3] scale-[1.01] shadow-md"
            : uploadState === "success"
            ? "border-[#347C70] bg-[#EBF5F3]"
            : uploadState === "error"
            ? "border-[#B65353] bg-[#FDF1F1]"
            : uploadState === "uploading"
            ? "border-[#D3DDE5] bg-[#FCFCF9]"
            : "border-[#D3DDE5] hover:border-[#17283B] hover:bg-[#F7F6F2] cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileInput}
        />

        <div className="p-10 flex flex-col items-center text-center space-y-4">
          {uploadState === "idle" || uploadState === "dragging" ? (
            <>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  uploadState === "dragging" ? "bg-[#347C70]/20" : "bg-[#E8EEF2]"
                }`}
              >
                <Upload
                  className={`w-7 h-7 transition-colors ${
                    uploadState === "dragging" ? "text-[#347C70]" : "text-[#526A80]"
                  }`}
                />
              </div>
              <div>
                <p className="text-base font-semibold text-[#17283B]">
                  {uploadState === "dragging"
                    ? "Release to upload your paper"
                    : "Upload a research paper"}
                </p>
                <p className="text-sm text-[#526A80] mt-1">
                  Drag & drop a PDF or{" "}
                  <span className="text-[#17283B] font-semibold underline underline-offset-2">
                    click to browse
                  </span>
                </p>
                <p className="text-xs text-[#75808F] mt-2">
                  PDF up to 10 MB · Text is extracted & indexed · No data stored externally
                </p>
              </div>
              <div className="flex items-center space-x-6 pt-2 text-xs text-[#75808F]">
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Research papers</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Theses & reports</span>
                </span>
              </div>
            </>
          ) : uploadState === "uploading" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[#E8EEF2] flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[#17283B] animate-spin" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#17283B]">Extracting & indexing…</p>
                <p className="text-sm text-[#526A80] mt-1 font-mono truncate max-w-xs">
                  {uploadedFile?.name}
                </p>
              </div>
              <div className="w-full max-w-sm space-y-1">
                <div className="flex justify-between text-xs text-[#75808F]">
                  <span>
                    {progress < 30
                      ? "Parsing PDF pages…"
                      : progress < 60
                      ? "Chunking content…"
                      : progress < 90
                      ? "Generating embeddings…"
                      : "Finalizing index…"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-[#E8EEF2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#17283B] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : uploadState === "success" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-[#EBF5F3] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#347C70]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#347C70]">Paper indexed successfully</p>
                <p className="text-sm text-[#526A80] mt-1">
                  Your paper is ready for evidence-based Q&A
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetState(); }}
                className="text-xs px-4 py-1.5 rounded border border-[#D3DDE5] hover:bg-[#F7F6F2] text-[#526A80] transition-colors"
              >
                Upload another paper
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-[#FDF1F1] flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-[#B65353]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#B65353]">Upload failed</p>
                <p className="text-sm text-[#B65353]/80 mt-1 max-w-xs">{errorMessage}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetState(); }}
                className="text-xs px-4 py-1.5 rounded bg-[#17283B] text-white hover:bg-[#223B56] transition-colors"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
