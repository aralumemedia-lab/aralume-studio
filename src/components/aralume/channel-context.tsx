import { useMemo, useState, type ReactNode } from "react";

import { mockChannels } from "@/mocks/mock-channels";
import { ChannelContext } from "@/components/aralume/channel-context-state";

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [activeChannelId, setActiveChannelId] = useState<string | undefined>(mockChannels[0]?.id);

  const value = useMemo(
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
