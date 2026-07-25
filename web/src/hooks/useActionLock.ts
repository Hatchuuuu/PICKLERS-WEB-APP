import { useState, useCallback, useRef } from "react";

/**
 * Hook to prevent duplicate/concurrent execution of async operations (double-click/race condition guard).
 */
export function useActionLock() {
  const [isLocked, setIsLocked] = useState(false);
  const lockedRef = useRef(false);

  const runWithLock = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current) return undefined;

    lockedRef.current = true;
    setIsLocked(true);

    try {
      const result = await action();
      return result;
    } finally {
      lockedRef.current = false;
      setIsLocked(false);
    }
  }, []);

  return { isLocked, runWithLock };
}
