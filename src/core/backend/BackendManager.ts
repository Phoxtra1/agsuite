// src/core/backend/BackendManager.ts

export type BackendType = "lovable" | "appwrite";

class BackendManager {
  private static backend: BackendType = (process.env.ACTIVE_BACKEND as BackendType) || "lovable";

  // Switch backend dynamically
  static setBackend(backend: BackendType) {
    this.backend = backend;
  }

  // Get current backend
  static getBackend(): BackendType {
    return this.backend;
  }

  // Convenience methods
  static isLovable(): boolean {
    return this.backend === "lovable";
  }

  static isAppwrite(): boolean {
    return this.backend === "appwrite";
  }
}

export default BackendManager;
