"use client";

import React from "react";
import Header from "@/components/chat/Header";
import ChatInput from "@/components/chat/ChatInput";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

export default function ChatPage() {
  const router = useRouter();

  const handleSendMessage = (message: string) => {
    // Generate new chat ID and redirect with initial message
    const chatId = nanoid();
    const encodedMessage = encodeURIComponent(message);
    router.push(`/chat/${chatId}?initialMessage=${encodedMessage}`);
  };

  return (
    <div className="relative h-full bg-white overflow-hidden">
      {/* Top Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none bg-[radial-gradient(125%_125%_at_50%_101%,rgba(0,119,190,1)_10.5%,rgba(0,150,199,1)_16%,rgba(0,180,216,1)_17.5%,rgba(72,202,228,1)_25%,rgba(144,224,239,1)_40%,rgba(186,230,253,1)_65%,rgba(224,242,254,1)_100%)]" />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex-none pt-8">
          <Header />
        </div>

        {/* Spacer to center the input */}
        <div className="flex-1 flex items-start justify-center mt-10">
          <ChatInput onSendMessage={handleSendMessage} isMainPage={true} />
        </div>
      </div>
    </div>
  );
}
