"use client";

import React, { useState, useEffect, use } from "react";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble from "@/components/chat/MessageBubble";

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
  searchParams,
}: ChatInstancePageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Unwrap the searchParams promise
  const unwrappedSearchParams = use(searchParams);

  // Initialize with the initial message if provided
  useEffect(() => {
    if (unwrappedSearchParams.initialMessage) {
      const userMessage: Message = {
        id: "1",
        role: "user",
        content: decodeURIComponent(unwrappedSearchParams.initialMessage),
        timestamp: new Date(),
      };

      setMessages([userMessage]);

      // Simulate AI response after a short delay
      setIsLoading(true);
      setTimeout(() => {
        const aiResponse: Message = {
          id: "2",
          role: "assistant",
          content: generateMockAIResponse(userMessage.content),
          timestamp: new Date(),
        };
        setMessages([userMessage, aiResponse]);
        setIsLoading(false);
      }, 1500);
    }
  }, [unwrappedSearchParams.initialMessage]);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockAIResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockAIResponse = (userInput: string): string => {
    const responses = [
      `Based on your query about "${userInput}", I can provide some insights about oceanographic data. Here's what I found:

## Key Findings

- **Temperature Range**: 18-26°C in the surface waters
- **Salinity Levels**: 34.5-35.5 PSU 
- **Data Points**: 1,247 ARGO float measurements

### Analysis

The data shows interesting patterns in the **Arabian Sea** region. Temperature gradients indicate strong seasonal thermoclines during monsoon periods.

\`\`\`
Location: 15.2°N, 68.4°E
Depth: 0-200m
Temperature: 24.3°C (surface)
Salinity: 35.1 PSU
\`\`\`

Would you like me to generate a visualization of this data?`,

      `Interesting question about "${userInput}"! Let me analyze the available ARGO float data:

## Ocean Data Summary

Your query relates to important oceanographic parameters. Here's what the data reveals:

### Current Conditions
- **Region**: Indian Ocean Basin
- **Float Count**: 45 active instruments
- **Last Update**: Today, 14:30 UTC

The measurements show:
1. **Thermal structure** varies significantly with depth
2. **Salinity patterns** indicate monsoon influence  
3. **Mixed layer depth** averages 65m in this season

*Note: This analysis is based on real-time ARGO float network data.*`,

      `Thank you for your question: "${userInput}". As an AI oceanographer, I can help analyze this data pattern.

## Research Context

Recent studies in **Marine Geophysical Research** indicate similar trends in this region. The data suggests:

### Physical Oceanography
- Temperature profiles show clear seasonal variation
- Salinity distribution reflects precipitation patterns
- Current velocity measurements indicate active circulation

### Statistical Overview
| Parameter | Mean | Range | Std Dev |
|-----------|------|-------|---------|
| Temperature (°C) | 23.4 | 18.2-27.8 | 2.1 |
| Salinity (PSU) | 34.9 | 33.1-36.2 | 0.8 |
| Depth (m) | 125 | 0-2000 | 245 |

Would you like me to explore specific aspects of this data further?`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Top Gradient Background - Same as main chat page */}
      <div
        className="absolute top-0 left-0 w-full h-[520px] z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #1e40af 0%, #0ea5e9 30%, #fff 100%)",
        }}
      />

      {/* Main Chat Container */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Messages Container - Full width scrollable area */}
        <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          {/* Centered content wrapper */}
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            {messages.map((message) => (
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
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
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
