"use client";

import React from "react";
import Header from "@/components/chat/Header";
import ChatInput from "@/components/chat/ChatInput";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

const GradientBackground = ({
  className,
  gradientFrom = "#fff",
  gradientTo = "#63e",
  gradientSize = "125% 125%",
  gradientPosition = "50% 10%",
  gradientStop = "40%",
}: {
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientSize?: string;
  gradientPosition?: string;
  gradientStop?: string;
}) => {
  return (
    <div
      className={cn("absolute inset-0 w-full h-full -z-10 bg-white", className)}
      style={{
        background: `radial-gradient(${gradientSize} at ${gradientPosition}, ${gradientFrom} ${gradientStop}, ${gradientTo} 100%)`,
      }}
    />
  );
};

export default function ChatPage() {
  const router = useRouter();

  const handleSendMessage = (message: string, expertMode: boolean = false) => {
    // Generate new chat ID and redirect with initial message
    const chatId = nanoid();
    const encodedMessage = encodeURIComponent(message);
    const expertModeParam = expertMode ? "&expertMode=true" : "";
    router.push(
      `/chat/${chatId}?initialMessage=${encodedMessage}${expertModeParam}`
    );
  };

  return (
    <div className="relative h-full bg-white overflow-hidden">
      {/* Gradient Background */}
      <GradientBackground
        gradientFrom="rgba(224,242,254,1)"
        gradientTo="rgba(0,119,190,1)"
        gradientSize="125% 125%"
        gradientPosition="50% 10%"
        gradientStop="40%"
        className="z-0 pointer-events-none"
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex-none pt-8 mt-25">
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
