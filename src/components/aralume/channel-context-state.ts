import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

import type { Channel } from "@/contracts/types";

export type ChannelContextValue = {
  activeChannelId: string | undefined;
  setActiveChannelId: Dispatch<SetStateAction<string | undefined>>;
  channels: Channel[];
  activeChannel: Channel | undefined;
};

export const ChannelContext = createContext<ChannelContextValue | null>(null);

export function useChannelContext(): ChannelContextValue {
  const ctx = useContext(ChannelContext);
  if (!ctx) {
    throw new Error("useChannelContext must be used within ChannelProvider");
  }

  return ctx;
}
