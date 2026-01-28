import { useEffect, useState } from "react";
import {
  ensureProfile,
  getCurrentUser,
  completeOnboarding,
  ProfileDoc,
  ProductKey,
} from "../lib/profile";
import { Onboarding } from "../components/ui/Onboarding";

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
      window.location.href = "/dashboard";
    }
  }, [loading, profile]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return null;

  if (!profile.onboardingComplete) {
    return (
      <Onboarding
        onSelect={async (choice: ProductKey) => {
          const updated = await completeOnboarding(profile.$id, choice);
          setProfile(updated);
          window.location.href = "/dashboard";
        }}
      />
    );
  }

  return null;
}
