// src/components/ui/tabs.tsx
import React, { useState } from "react";

export const Tabs: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tabs">{children}</div>
);

export const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tabs-list flex space-x-4">{children}</div>
);

export const TabsTrigger: React.FC<{ value: string; onClick: () => void }> = ({
  value,
  children,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="tabs-trigger px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
    data-value={value}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<{ value: string; activeTab: string }> = ({
  value,
  activeTab,
  children,
}) => (
  activeTab === value ? <div className="tabs-content p-4">{children}</div> : null
);
