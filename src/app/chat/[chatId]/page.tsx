"use client";

import React, { useEffect, useRef, use, useCallback } from "react";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble from "@/components/chat/MessageBubble";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

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

  // Load existing messages from database
  const existingMessages = useQuery(api.chats.getMessagesForChat, { chatId });

  // Ref for scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to track if initial message has been sent
  const initialMessageSent = useRef(false);
  const existingMessagesLoaded = useRef(false);

  // Use the v5 useChat hook with proper transport
  const { messages, status, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, body }) => {
        return {
          body: {
            chatId: chatId, // Always pass the chatId from URL
            messages,
            ...body,
          },
        };
      },
    }),
  });

  // Load existing messages into the chat when they're available
  useEffect(() => {
    console.log(
      "📨 existingMessages:",
      existingMessages,
      "loaded:",
      existingMessagesLoaded.current
    );

    if (existingMessages !== undefined && !existingMessagesLoaded.current) {
      console.log("💾 Processing existing messages...");

      // existingMessages is an array (empty or with messages) or null
      if (existingMessages && existingMessages.length > 0) {
        console.log("📚 Found", existingMessages.length, "existing messages");
        const convertedExistingMessages = existingMessages.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: msg.content }],
        }));
        setMessages(convertedExistingMessages);
      } else {
        console.log("📭 No existing messages found (new chat)");
      }

      // Mark as loaded regardless of whether we found messages or not
      existingMessagesLoaded.current = true;
      console.log(
        "✅ Existing messages loaded, can proceed with initial message"
      );
    }
  }, [existingMessages, setMessages]);

  // Handle initial message from search params
  const handleInitialMessage = useCallback(() => {
    if (
      unwrappedSearchParams.initialMessage &&
      messages.length === 0 &&
      !initialMessageSent.current &&
      existingMessagesLoaded.current // Only proceed after we've loaded existing messages
    ) {
      console.log(
        "🚀 Sending initial message:",
        unwrappedSearchParams.initialMessage
      );
      const initialMsg = decodeURIComponent(
        unwrappedSearchParams.initialMessage
      );
      // Send the initial message immediately
      sendMessage({ text: initialMsg });
      initialMessageSent.current = true;
    }
  }, [unwrappedSearchParams.initialMessage, messages.length, sendMessage]);

  // For new chats with initial message, send it immediately without waiting
  useEffect(() => {
    if (
      unwrappedSearchParams.initialMessage &&
      !initialMessageSent.current &&
      messages.length === 0 &&
      existingMessages !== undefined // Convex query has completed (empty array for new chat)
    ) {
      console.log("🚀 New chat detected, sending initial message immediately");
      const initialMsg = decodeURIComponent(
        unwrappedSearchParams.initialMessage
      );
      sendMessage({ text: initialMsg });
      initialMessageSent.current = true;
      existingMessagesLoaded.current = true; // Mark as loaded since it's a new chat
    }
  }, [
    unwrappedSearchParams.initialMessage,
    messages.length,
    sendMessage,
    existingMessages,
  ]);

  useEffect(() => {
    handleInitialMessage();
  }, [handleInitialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, status]);

  const handleSendMessage = (content: string) => {
    // Don't send messages while loading existing messages
    if (isLoadingExistingMessages) return;

    // Send message using v5 API
    sendMessage({ text: content });
  };

  const isLoading = status === "streaming" || status === "submitted";
  // Only show loading spinner if Convex is still querying AND we don't have an initial message to send
  // For new chats with initial messages, skip the loading state to avoid blank screen
  const isLoadingExistingMessages =
    existingMessages === undefined && !unwrappedSearchParams.initialMessage;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Main Chat Container */}
      <div className="flex flex-col h-full">
        {/* Messages Container - Full width scrollable area */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          {/* Centered content wrapper */}
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            {/* Show loading state while fetching existing messages */}
            {isLoadingExistingMessages ? (
              <div className="flex justify-center items-center h-32">
                <div
                  className="h-4 w-4  animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                  role="status"
                  aria-label="Loading"
                />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4 max-w-2xl">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="rounded-full bg-gray-400 h-1 w-1"></div>
                            <div className="rounded-full bg-gray-400 h-1 w-1"></div>
                            <div className="rounded-full bg-gray-400 h-1 w-1"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </>
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
