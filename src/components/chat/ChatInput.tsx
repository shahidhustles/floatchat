"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Zap } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useExpertMode } from "@/contexts/expert-mode-context";

interface ChatInputProps {
  onSendMessage?: (message: string, expertMode?: boolean) => void;
  isMainPage?: boolean;
  onExpertMode?: () => void;
}

export default function ChatInput({
  onSendMessage,
  isMainPage = false,
  onExpertMode,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { expertMode, toggleExpertMode } = useExpertMode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !onSendMessage) return;

    // Pass both message and expert mode state
    onSendMessage(message, expertMode);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift+Enter will create a new line (default behavior)
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Model Indicator */}

      {/* Chat Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
          {/* Text Input */}
          <div className="flex-1 relative">
            <TextareaAutosize
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about ocean temperature trends, ARGO float data, salinity patterns ..."
              className={`w-full bg-transparent text-gray-900 placeholder-gray-600 p-4 pr-12 resize-none border-0 outline-none max-h-32 ${
                isMainPage ? "min-h-[96px]" : "min-h-[32px]"
              }`}
              minRows={1}
              maxRows={4}
            />
          </div>

          {/* Expert Mode Button */}
          <div className="p-2">
            <Button
              type="button"
              size="sm"
              variant={expertMode ? "default" : "outline"}
              onClick={() => {
                toggleExpertMode();
                onExpertMode?.();
              }}
              className={`rounded-lg p-2 transition-colors mr-2 ${
                expertMode
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "border-blue-500 text-blue-500 hover:bg-blue-50"
              }`}
              title="Toggle Expert Mode - Uses specialized OceanGPT model"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>

          {/* Send Button */}
          <div className="p-2">
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom Helper Text */}
        <div className="text-xs mt-2 text-center drop-shadow-sm">
          {expertMode ? (
            <span className="text-slate-700 font-medium">
              Expert Mode Active - Using specialized OceanGPT model for advanced
              marine science analysis
            </span>
          ) : (
            <span className="text-slate-700">
              FloatChat can help analyze oceanographic data, visualize trends,
              and provide research insights.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
