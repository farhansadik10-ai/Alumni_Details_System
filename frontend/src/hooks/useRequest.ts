import { useCallback, useEffect, useRef, useState } from "react";
import type { DependencyList } from "react";

export interface UseRequestOptions {
  // When false, nothing is fetched (e.g. until an id is known). Defaults to true.
  enabled?: boolean;
}

export interface UseRequestResult<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  reload: () => void;
}

// Runs `request` when `deps` change (or reload() is called) and tracks data / loading / error.
// Responses from superseded runs and from after unmount are ignored.
export default function useRequest<T>(
  request: () => Promise<T>,
  deps: DependencyList,
  { enabled = true }: UseRequestOptions = {}
): UseRequestResult<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>();
  const [reloadCount, setReloadCount] = useState(0);

  const requestRef = useRef(request);
  requestRef.current = request;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(undefined);

    requestRef.current().then(
      (result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      },
      (err: unknown) => {
        if (!active) return;
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      active = false;
    };
    // `request` is read through a ref; re-runs are driven by the caller's deps, like useEffect.
  }, [enabled, reloadCount, ...deps]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  return { data, loading, error, reload };
}
