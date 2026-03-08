// src/core/backend/BackendManager.ts

export type BackendType = "lovable" | "appwrite";

type BackendChangeListener = (backend: BackendType) => void;

class BackendManager {
  private static backend: BackendType =
    (import.meta.env.VITE_BACKEND_PROVIDER as BackendType) || "lovable";

  private static listeners: Set<BackendChangeListener> = new Set();

  /** Switch backend dynamically and notify all listeners */
  static setBackend(backend: BackendType) {
    if (this.backend === backend) return;
    this.backend = backend;
    // Persist preference so it survives page-level navigations within session
    try {
      sessionStorage.setItem("amineva_backend", backend);
    } catch {}
    this.listeners.forEach((fn) => fn(backend));
  }

  /** Get current backend */
  static getBackend(): BackendType {
    // Check session override first
    try {
      const stored = sessionStorage.getItem("amineva_backend") as BackendType | null;
      if (stored === "lovable" || stored === "appwrite") {
        this.backend = stored;
      }
    } catch {}
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
