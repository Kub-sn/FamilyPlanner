import { createContext, useContext, type ReactNode } from 'react';
import type { TabId } from '../lib/planner-data';

type ActiveTabContextValue = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
};

const ActiveTabContext = createContext<ActiveTabContextValue | null>(null);

export function ActiveTabProvider({
  activeTab,
  setActiveTab,
  children,
}: ActiveTabContextValue & { children: ReactNode }) {
  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ActiveTabContext.Provider>
  );
}

export function useActiveTab(): ActiveTabContextValue {
  const context = useContext(ActiveTabContext);
  if (!context) {
    throw new Error('useActiveTab must be used within an ActiveTabProvider');
  }
  return context;
}
