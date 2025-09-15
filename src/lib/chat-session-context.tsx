"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatSessionContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  createNewSession: (title?: string) => ChatSession;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
}

const ChatSessionContext = createContext<ChatSessionContextType | undefined>(
  undefined
);

// Mock data for now - in a real app, this would come from your database
const initialSessions: ChatSession[] = [
  {
    id: "1",
    title: "Ocean Temperature Analysis",
    timestamp: "2 hours ago",
    preview: "Show me temperature data near Mumbai...",
    messageCount: 12,
    createdAt: new Date("2024-01-15T10:00:00"),
    updatedAt: new Date("2024-01-15T14:30:00"),
  },
  {
    id: "2",
    title: "Salinity Trends",
    timestamp: "1 day ago",
    preview: "What's the salinity trend in Bay of Bengal?",
    messageCount: 8,
    createdAt: new Date("2024-01-14T15:30:00"),
    updatedAt: new Date("2024-01-14T16:45:00"),
  },
  {
    id: "3",
    title: "Depth Profile Comparison",
    timestamp: "3 days ago",
    preview: "Compare depth profiles between two locations",
    messageCount: 15,
    createdAt: new Date("2024-01-12T09:15:00"),
    updatedAt: new Date("2024-01-12T11:20:00"),
  },
];

export function ChatSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const createNewSession = useCallback((title = "New Chat"): ChatSession => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title,
      timestamp: "now",
      preview: "",
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession;
  }, []);

  const updateSession = useCallback(
    (id: string, updates: Partial<ChatSession>) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        )
      );
    },
    []
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((session) => session.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    },
    [currentSessionId]
  );

  const value: ChatSessionContextType = {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
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
