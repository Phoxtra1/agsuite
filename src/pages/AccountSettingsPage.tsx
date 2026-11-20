import { ApplicationHubTools } from "@/components/home/ApplicationHubTools";

export default function AccountSettingsPage() {
  return <ApplicationHubTools open onOpenChange={() => undefined} initialTab="account" />;
}
