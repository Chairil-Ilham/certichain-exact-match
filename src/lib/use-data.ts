import { useEffect, useState, useSyncExternalStore } from "react";
import { getVersion, subscribe } from "./store";

type State<T> = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; data: T };

/** Loads async service data and re-loads when the demo store changes. */
export function useData<T>(fn: () => Promise<T>, deps: unknown[] = []): State<T> {
  const version = useSyncExternalStore(subscribe, getVersion, () => 0);
  const [state, setState] = useState<State<T>>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fn()
      .then((data) => alive && setState({ status: "ready", data }))
      .catch((e: unknown) => alive && setState({ status: "error", error: e instanceof Error ? e.message : "Gagal memuat data" }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return state;
}
