"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ExpertModeContextType {
  expertMode: boolean;
  setExpertMode: (value: boolean) => void;
  toggleExpertMode: () => void;
}

const ExpertModeContext = createContext<ExpertModeContextType | undefined>(
  undefined
);

export function ExpertModeProvider({ children }: { children: ReactNode }) {
  const [expertMode, setExpertMode] = useState(false);

  const toggleExpertMode = () => {
    setExpertMode((prev) => !prev);
  };

  return (
    <ExpertModeContext.Provider
      value={{
        expertMode,
        setExpertMode,
        toggleExpertMode,
      }}
    >
      {children}
    </ExpertModeContext.Provider>
  );
}

export function useExpertMode() {
  const context = useContext(ExpertModeContext);
  if (context === undefined) {
    throw new Error("useExpertMode must be used within an ExpertModeProvider");
  }
  return context;
}
