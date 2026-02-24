import React, { useState, useEffect } from "react";
import BackendManager from "@/core/backend/BackendManager";

export const BackendToggle: React.FC = () => {
  const [backend, setBackend] = useState<"lovable" | "appwrite">(BackendManager.getBackend());

  const handleToggle = () => {
    const newBackend = backend === "lovable" ? "appwrite" : "lovable";
    BackendManager.setBackend(newBackend); // switch backend
    setBackend(newBackend);
    alert(`Backend switched to: ${newBackend}`); // optional feedback
  };

  useEffect(() => {
    setBackend(BackendManager.getBackend());
  }, []);

  return (
    <div className="flex items-center gap-2 mb-4">
      <span>Current Backend: <strong>{backend}</strong></span>
      <button
        onClick={handleToggle}
        className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Toggle Backend
      </button>
    </div>
  );
};
