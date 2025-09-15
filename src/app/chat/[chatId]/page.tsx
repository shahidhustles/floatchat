"use client";

import React, { useEffect, useRef, use } from "react";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble from "@/components/chat/MessageBubble";
import { useChat } from "@ai-sdk/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInstancePageProps {
  params: Promise<{
    chatId: string;
  }>;
  searchParams: Promise<{
    initialMessage?: string;
  }>;
}

export default function ChatInstancePage({
  params,
  searchParams,
}: ChatInstancePageProps) {
  // Unwrap the promises
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const chatId = unwrappedParams.chatId;

  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the useChat hook from AI SDK with chatId
  const { messages, isLoading, append } = useChat({
    api: "/api/chat",
    body: {
      chatId: chatId, // Always pass the chatId from URL
    },
  });

  // Handle initial message from search params
  useEffect(() => {
    if (unwrappedSearchParams.initialMessage && messages.length === 0) {
      const initialMsg = decodeURIComponent(
        unwrappedSearchParams.initialMessage
      );
      // Use append to add the initial message to the chat
      append({
        role: "user",
        content: initialMsg,
      });
    }
  }, [unwrappedSearchParams.initialMessage, append, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, isLoading]);

  // Convert AI SDK messages to our local Message format for compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertedMessages: Message[] = messages.map((msg: any) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: new Date(), // AI SDK doesn't provide timestamps by default
  }));

  const handleSendMessage = (content: string) => {
    // Use append to add user message and trigger AI response
    append({
      role: "user",
      content,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Main Chat Container */}
      <div className="flex flex-col h-full">
        {/* Messages Container - Full width scrollable area */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          {/* Centered content wrapper */}
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            {convertedMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                      <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                    </div>
                    <span className="text-sm text-gray-500">
                      FloatChat is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll target */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input at Bottom */}
        <div className="border-t bg-white/90 backdrop-blur-sm p-4">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
