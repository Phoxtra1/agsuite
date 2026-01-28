import type { ProductKey } from "../../lib/profile";

type Props = {
  onSelect: (choice: ProductKey) => void | Promise<void>;
};

export function Onboarding({ onSelect }: Props) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>What are you here to do?</h1>
      <p style={{ marginBottom: 20 }}>Pick one. You can activate more tools later.</p>

      <div style={{ display: "grid", gap: 12 }}>
        <button onClick={() => onSelect("hub")}>
          Reports, Insights & Publications → Amineva Hub
        </button>
        <button onClick={() => onSelect("agstock")}>
          Track stock & Inventory → AG Stock
        </button>
        <button onClick={() => onSelect("agis")}>
          Use intelligence system → AGIS
        </button>
        <button onClick={() => onSelect("ops")}>
          Service Operations → AminevaOps
        </button>
        <button onClick={() => onSelect("amniva")}>
          Verify & Predictions → Amniva
        </button>
        <button onClick={() => onSelect("explore")}>
          Explore later → Skip for now
        </button>
      </div>
    </div>
  );
}
