import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/**
 * Fetches `path` (with `params`) and refetches when they change. Returns { data, error, loading, reload }.
 * Pass `null` as the path to skip fetching (e.g. data only one role needs).
 */
export function useApi(path, params) {
  const key = JSON.stringify(params || {});
  const [state, setState] = useState({ data: null, error: '', loading: path !== null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    api(path, { params: JSON.parse(key) })
      .then((data) => !cancelled && setState({ data, error: '', loading: false }))
      .catch((err) => !cancelled && setState({ data: null, error: err.message, loading: false }));
    return () => {
      cancelled = true;
    };
  }, [path, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
