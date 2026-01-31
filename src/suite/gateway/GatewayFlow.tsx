import { useState } from "react";
import { GatewayStep } from "./gatewayState";

export function GatewayFlow() {
  const [step, setStep] = useState<GatewayStep>("intent");

  const [selectedProductKey, setSelectedProductKey] =
    useState<string | null>(localStorage.getItem("selectedProductKey"));

  function selectProduct(key: string) {
    localStorage.setItem("selectedProductKey", key);
    setSelectedProductKey(key);

    if (key === "agstock") {
      setStep("preauth_agstock");
    } else {
      setStep("auth");
    }
  }

  return null; // UI already exists, wiring only
}
