"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import {
  FileText,
  Github,
  LineChart,
  Code2,
  Image as ImageIcon,
  ArrowRight,
  Search,
  MessageSquare,
  Paperclip,
  Mic,
  PlusIcon
} from "lucide-react";
import HoverBorderGradient from "./hover-border-gradient";

function useAutoResizeTextarea({ minHeight, maxHeight }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(
    (reset) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight || Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export default function BotChat({ query, setQuery, handleSearch, fileInputRef, selectedFile, setSelectedFile, isListening, toggleListening }) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch(e);
    }
  }

  return (
    <div className="w-full flex flex-col items-start mt-2 relative">
      {/* The Purple Light Horizon Glow you requested! */}
      <div className="absolute top-[-50%] left-1/2 -translate-x-1/2 w-[110%] h-[300px] bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-transparent blur-[90px] rounded-[100%] pointer-events-none -z-10" />

      {/* Input Box Section */}
      <div className="w-full max-w-3xl mb-4 relative z-10">
        <HoverBorderGradient 
          as="form" 
          onSubmit={handleSearch} 
          containerClassName="w-full rounded-2xl shadow-2xl p-px hover:bg-black" 
          className="w-full rounded-2xl bg-black p-0 flex flex-col"
        >
          {selectedFile && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-800 bg-black rounded-t-2xl text-neutral-300 text-sm">
                <ImageIcon size={16} />
                <a 
                  href={selectedFile ? URL.createObjectURL(selectedFile) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap cursor-pointer hover:underline text-blue-400"
                  title="Click to view file"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedFile.name}
                </a>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-300 transition-colors" title="Remove attachment">
                    ×
                </button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              adjustHeight();
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask anything about research, papers, or GitHub projects..."
            className={cn(
              "w-full px-4 py-3 resize-none border-none",
              "bg-black text-white text-base",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-500 min-h-[48px]",
              selectedFile ? "rounded-t-none" : "rounded-t-2xl"
            )}
            style={{ overflow: "hidden" }}
          />
          <input
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0]);
                  }
              }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between p-3 border-t border-neutral-800 bg-black rounded-b-2xl">
            <div className="flex items-center gap-1">
                <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Document"
                >
                <Paperclip className="w-5 h-5" />
                </Button>
                <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("hover:bg-neutral-800 rounded-full transition-colors", isListening ? "text-red-400 hover:text-red-300" : "text-neutral-400 hover:text-white")}
                onClick={toggleListening}
                title="Voice Input"
                >
                <Mic className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg transition-all font-medium",
                  query.trim() || selectedFile ? "bg-white text-black hover:bg-neutral-200 cursor-pointer" : "bg-neutral-800 text-neutral-500 cursor-not-allowed hover:bg-neutral-800"
                )}
                disabled={!query.trim() && !selectedFile}
              >
                Start <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </HoverBorderGradient>

        {/* Quick Actions (Themed) */}
        <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
          <QuickAction icon={<FileText className="w-4 h-4" />} label="Summarize Paper" />
          <QuickAction icon={<Github className="w-4 h-4" />} label="Analyze Repo" />
          <QuickAction icon={<LineChart className="w-4 h-4" />} label="Research Insights" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="flex items-center gap-2 rounded-full border-neutral-700 bg-black/40 text-neutral-300 hover:text-white hover:bg-neutral-700 backdrop-blur-sm"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}
