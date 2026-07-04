import { useCallback, useRef, useState } from "react";

/** Simple linear undo/redo stack. Keeps the last `limit` snapshots. */
export function useUndoRedo<T>(initial: T, limit = 50) {
  const [state, setStateInternal] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);

  const set = useCallback((next: T | ((prev: T) => T), record = true) => {
    setStateInternal((prev) => {
      const value = typeof next === "function" ? (next as any)(prev) : next;
      if (record) {
        past.current.push(prev);
        if (past.current.length > limit) past.current.shift();
        future.current = [];
      }
      return value;
    });
  }, [limit]);

  const reset = useCallback((value: T) => {
    past.current = []; future.current = [];
    setStateInternal(value);
  }, []);

  const undo = useCallback(() => {
    setStateInternal((prev) => {
      const prior = past.current.pop();
      if (prior === undefined) return prev;
      future.current.push(prev);
      return prior;
    });
  }, []);

  const redo = useCallback(() => {
    setStateInternal((prev) => {
      const next = future.current.pop();
      if (next === undefined) return prev;
      past.current.push(prev);
      return next;
    });
  }, []);

  return {
    state, set, reset, undo, redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
