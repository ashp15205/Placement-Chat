import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://placementchat.vercel.app";

  const supabase = await createClient();
  const { data: experiences } = await supabase
    .from("experiences")
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const experienceUrls: MetadataRoute.Sitemap = (experiences ?? []).map((exp) => ({
    url: `${base}/feed/${exp.id}`,
    lastModified: new Date(exp.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/feed`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...experienceUrls,
  ];
}
