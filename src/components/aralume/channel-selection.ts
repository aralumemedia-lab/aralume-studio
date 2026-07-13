import type { Channel } from "@/contracts/types";

export type ChannelSelectionState = {
  activeChannelId: string | undefined;
  selectionInitialized: boolean;
};

export function deriveChannelSelection(
  channels: Channel[],
  activeChannelId: string | undefined,
  selectionInitialized: boolean,
): ChannelSelectionState {
  if (channels.length === 0) {
    return {
      activeChannelId: undefined,
      selectionInitialized,
    };
  }

  const activeExists = activeChannelId
    ? channels.some((channel) => channel.id === activeChannelId)
    : false;

  if (!selectionInitialized) {
    return {
      activeChannelId: channels[0]?.id,
      selectionInitialized: true,
    };
  }

  if (activeChannelId === undefined) {
    return {
      activeChannelId: undefined,
      selectionInitialized,
    };
  }

  if (!activeExists) {
    return {
      activeChannelId: channels[0]?.id,
      selectionInitialized: true,
    };
  }

  return {
    activeChannelId,
    selectionInitialized,
  };
}
