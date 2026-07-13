import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { getChannels } from "@/services/channels-api";
import { ChannelContext } from "@/components/aralume/channel-context-state";
import { deriveChannelSelection } from "@/components/aralume/channel-selection";
import { ApiRequestError } from "@/services/http-client";

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [activeChannelId, setActiveChannelIdState] = useState<string | undefined>(undefined);
  const [selectionInitialized, setSelectionInitialized] = useState(false);
  const channelsQuery = useQuery({
    queryKey: ["channels"],
    queryFn: getChannels,
    staleTime: 30_000,
    retry: 1,
  });
  const channels = useMemo(() => channelsQuery.data?.data ?? [], [channelsQuery.data]);
  const resolvedSelection = useMemo(
    () => deriveChannelSelection(channels, activeChannelId, selectionInitialized),
    [activeChannelId, channels, selectionInitialized],
  );

  const setActiveChannelId = useCallback(
    (value: string | undefined | ((previous: string | undefined) => string | undefined)) => {
      setSelectionInitialized(true);
      setActiveChannelIdState((previous) =>
        typeof value === "function" ? value(previous) : value,
      );
    },
    [],
  );

  useEffect(() => {
    const nextSelection = resolvedSelection;
    if (
      nextSelection.activeChannelId !== activeChannelId ||
      nextSelection.selectionInitialized !== selectionInitialized
    ) {
      setActiveChannelIdState(nextSelection.activeChannelId);
      setSelectionInitialized(nextSelection.selectionInitialized);
    }
  }, [activeChannelId, resolvedSelection, selectionInitialized]);

  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === resolvedSelection.activeChannelId),
    [channels, resolvedSelection.activeChannelId],
  );

  const error = channelsQuery.error instanceof ApiRequestError ? channelsQuery.error : null;

  const value = useMemo(
    () => ({
      activeChannelId: resolvedSelection.activeChannelId,
      setActiveChannelId,
      channels,
      activeChannel,
      loading: channelsQuery.isPending,
      error,
      refreshChannels: channelsQuery.refetch,
    }),
    [
      activeChannel,
      channels,
      channelsQuery.isPending,
      channelsQuery.refetch,
      error,
      resolvedSelection.activeChannelId,
      setActiveChannelId,
    ],
  );

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}
