import { useNavigate } from "react-router-dom";
import { ApplicationHubTools } from "@/components/home/ApplicationHubTools";

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  return <main className="min-h-[70vh] bg-background"><ApplicationHubTools open onOpenChange={(open) => { if (!open) navigate("/"); }} initialTab="account" /></main>;
}
