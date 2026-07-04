import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadUserProfile } from "@/lib/auth/load-profile";
import { ProfilePageClient } from "./profile-page-client";

export const metadata: Metadata = {
  title: "Profile — Recall",
  description: "Manage your profile, avatar, and password.",
};

export default async function ProfilePage() {
  const profile = await loadUserProfile();

  if (!profile) {
    redirect("/login?next=/profile");
  }

  return <ProfilePageClient profile={profile} />;
}
