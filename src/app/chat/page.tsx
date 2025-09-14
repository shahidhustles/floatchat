"use client";

import React from "react";
import Header from "@/components/chat/Header";
import Globe from "@/components/chat/Globe";
import ChatInput from "@/components/chat/ChatInput";

export default function ChatPage() {
  return (
    <div className="relative max-h-screen bg-white overflow-hidden">
      {/* Top Gradient Background */}
      <div
        className="absolute top-0 left-0 w-full h-[520px] z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #1e40af 0%, #0ea5e9 30%, #fff 100%)",
        }}
      />

      {/* Globe Centered at Top */}
      <div className="absolute top-0 left-3/5 z-10 -translate-x-1/2 w-[50vw] h-[50vh] flex items-start justify-center pointer-events-none">
        <Globe />
      </div>

      {/* Main Content */}
      <div className="relative z-20 mt-40 flex flex-col min-h-screen">
        {/* Header Section */}
        <div className="flex-none pt-8">
          <Header />
        </div>

        {/* Spacer to center the input, with less vertical gap */}
        <div className="flex-1 flex items-start justify-center mt-10">
          <ChatInput isMainPage={true} />
        </div>
      </div>
    </div>
  );
}
