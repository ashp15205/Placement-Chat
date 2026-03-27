import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./profile-client";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { title: "Profile" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const name = profile?.full_name || profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return {
    title: `${name}'s Profile`,
    description: `View ${name}'s contributions and saved interview intelligence on PlacementChat.`,
  };
}

export default function ProfilePage() {
  return <ProfileClient />;
}
