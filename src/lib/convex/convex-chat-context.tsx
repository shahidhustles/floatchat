"use client";

import React, { createContext, useContext, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export interface ChatSession {
  _id: Id<"chats">;
  chatId: string; // Frontend UUID
  title: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  preview: string;
}

interface ChatSessionContextType {
  sessions: ChatSession[] | undefined;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  createNewSession: (title?: string) => Promise<string | null>;
  updateSession: (chatId: string, title: string) => Promise<void>;
  deleteSession: (chatId: string) => Promise<void>;
  isLoading: boolean;
}

const ChatSessionContext = createContext<ChatSessionContextType | undefined>(
  undefined
);

export function ChatSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Fetch user's chats from Convex
  const sessions = useQuery(
    api.queries.getUserChats,
    user?.id ? { userId: user.id } : "skip"
  );

  // Mutations
  const createChatMutation = useMutation(api.chats.createChat);
  const updateChatTitleMutation = useMutation(api.chats.updateChatTitle);
  const deleteChatMutation = useMutation(api.chats.deleteChat);

  const createNewSession = async (
    title = "New Chat"
  ): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const chatId = crypto.randomUUID(); // Generate UUID
      await createChatMutation({
        chatId: chatId,
        userId: user.id,
        title,
      });
      setCurrentSessionId(chatId);
      return chatId;
    } catch {
      return null;
    }
  };

  const updateSession = async (
    chatId: string,
    title: string
  ): Promise<void> => {
    try {
      await updateChatTitleMutation({ chatId: chatId, title });
    } catch {
      // Failed to update chat
    }
  };

  const deleteSession = async (chatId: string): Promise<void> => {
    try {
      await deleteChatMutation({ chatId: chatId });
      if (currentSessionId === chatId) {
        setCurrentSessionId(null);
      }
    } catch {
      // Failed to delete chat
    }
  };

  const value: ChatSessionContextType = {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
    isLoading: sessions === undefined,
  };

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
}

export function useChatSessions() {
  const context = useContext(ChatSessionContext);
  if (context === undefined) {
    throw new Error(
      "useChatSessions must be used within a ChatSessionProvider"
    );
  }
  return context;
}

export { ChatSessionContext };
