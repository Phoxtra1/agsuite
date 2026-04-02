// src/core/backend/BackendManager.ts

export type BackendType = "lovable" | "appwrite";

type BackendChangeListener = (backend: BackendType) => void;

class BackendManager {
  private static backend: BackendType = BackendManager.loadStored();

  private static listeners: Set<BackendChangeListener> = new Set();

  /** Load from localStorage (persistent across refreshes) */
  private static loadStored(): BackendType {
    try {
      const stored = localStorage.getItem("amineva_backend") as BackendType | null;
      if (stored === "lovable" || stored === "appwrite") return stored;
    } catch {}
    // Default to lovable
    return (import.meta.env.VITE_BACKEND_PROVIDER as BackendType) || "lovable";
  }

  /** Switch backend dynamically and notify all listeners */
  static setBackend(backend: BackendType) {
    if (this.backend === backend) return;
    this.backend = backend;
    try {
      localStorage.setItem("amineva_backend", backend);
    } catch {}
    this.listeners.forEach((fn) => fn(backend));
  }

  /** Get current backend */
  static getBackend(): BackendType {
    return this.backend;
  }

  static isLovable(): boolean {
    return this.getBackend() === "lovable";
  }

  static isAppwrite(): boolean {
    return this.getBackend() === "appwrite";
  }

  /** Subscribe to backend changes. Returns unsubscribe function. */
  static onChange(listener: BackendChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export default BackendManager;
