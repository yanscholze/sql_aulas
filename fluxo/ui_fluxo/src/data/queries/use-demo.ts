import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { dispatch, loadDemo } from "../demo/storage";
import { derived } from "../demo/selectors";
import type { Command } from "../contracts/models";
const KEY = ["demo"] as const;
export function useDemo() {
  const query = useQuery({
    queryKey: KEY,
    queryFn: loadDemo,
    staleTime: Infinity,
    retry: false,
  });
  const view = useMemo(
    () => (query.data ? derived(query.data) : undefined),
    [query.data],
  );
  return { ...query, state: query.data, view };
}
export function useCommand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (command: Command) => dispatch(command),
    onSuccess(data) {
      client.setQueryData(KEY, data);
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("fluxo-ui");
        channel.postMessage(data.revision);
        channel.close();
      }
    },
  });
}
export function SyncDemo() {
  const client = useQueryClient();
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel("fluxo-ui");
    c.onmessage = () => void client.invalidateQueries({ queryKey: KEY });
    return () => c.close();
  }, [client]);
  return null;
}
