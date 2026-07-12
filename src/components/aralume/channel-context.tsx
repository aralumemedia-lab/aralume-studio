import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { mockChannels } from "@/mocks/mock-channels";
import type { Channel } from "@/contracts/types";

type ChannelContextValue = {
  activeChannelId: string | undefined;
  setActiveChannelId: (id: string | undefined) => void;
  channels: Channel[];
  activeChannel: Channel | undefined;
};

const ChannelContext = createContext<ChannelContextValue | null>(null);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [activeChannelId, setActiveChannelId] = useState<string | undefined>(
    mockChannels[0]?.id,
  );

  const value = useMemo<ChannelContextValue>(
    () => ({
      activeChannelId,
      setActiveChannelId,
      channels: mockChannels,
      activeChannel: mockChannels.find((c) => c.id === activeChannelId),
    }),
    [activeChannelId],
  );

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export function useChannelContext(): ChannelContextValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) throw new Error("useChannelContext must be used within ChannelProvider");
  return ctx;
}
