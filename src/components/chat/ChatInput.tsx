"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useRouter } from "next/navigation";

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  isMainPage?: boolean;
}

export default function ChatInput({
  onSendMessage,
  isMainPage = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (isMainPage) {
      // Redirect to new chat instance with the message
      const chatId = `chat-${Date.now()}`;
      const encodedMessage = encodeURIComponent(message);
      router.push(`/chat/${chatId}?initialMessage=${encodedMessage}`);
    } else if (onSendMessage) {
      // Send message to existing chat
      onSendMessage(message);
      setMessage("");
    }
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
        <div className="text-xs text-slate-700 mt-2 text-center drop-shadow-sm">
          FloatChat can help analyze oceanographic data, visualize trends, and
          provide research insights. 
        </div>
      </form>
    </div>
  );
}
