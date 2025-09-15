"use client";

import React from "react";
import Header from "@/components/chat/Header";
// import Globe from "@/components/chat/Globe"; // Commented out
import ChatInput from "@/components/chat/ChatInput";

export default function ChatPage() {
  return (
    <div className="relative max-h-screen bg-white overflow-hidden">
      {/* Top Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none bg-[radial-gradient(125%_125%_at_50%_101%,rgba(0,119,190,1)_10.5%,rgba(0,150,199,1)_16%,rgba(0,180,216,1)_17.5%,rgba(72,202,228,1)_25%,rgba(144,224,239,1)_40%,rgba(186,230,253,1)_65%,rgba(224,242,254,1)_100%)]" />

      {/* Globe Centered at Top - Commented Out */}
      {/* <div className="absolute top-0 left-3/5 z-10 -translate-x-1/2 w-[50vw] h-[50vh] flex items-start justify-center pointer-events-none">
        <Globe />
      </div> */}

      {/* Main Content */}
      <div className="relative z-20 mt-20 flex flex-col min-h-screen">
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
