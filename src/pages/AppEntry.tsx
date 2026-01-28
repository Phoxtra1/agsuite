import { useEffect, useState } from "react";
import { ensureProfile, getCurrentUser, ProfileDoc, ProductKey } from "../lib/profile";
import { Onboarding } from "../ui/Onboarding";

export function AppEntry() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileDoc | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        const prof = await ensureProfile(user.$id);
        setProfile(prof);
      } catch {
        window.location.href = "/login";
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && profile?.onboardingComplete) {
      // Send them to Suite dashboard (recommended),
      // or directly to the product they chose.
      window.location.href = "/dashboard";
    }
  }, [loading, profile]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return null;

  if (!profile.onboardingComplete) {
    return (
      <Onboarding
        onSelect={async (choice: ProductKey) => {
          const { completeOnboarding } = await import("../lib/profile");
          const updated = await completeOnboarding(profile.$id, choice);
          setProfile(updated);

          // Option A: go to Suite dashboard where “Go to AG Stock/AGIS” buttons exist
          window.location.href = "/dashboard";

          // Option B (later): route straight to product subdomain based on choice
          // if (choice === "agstock") window.location.href = "https://stock.amineva.com";
          // if (choice === "agis") window.location.href = "https://app.amineva.com";
        }}
      />
    );
  }

  return null;
}
