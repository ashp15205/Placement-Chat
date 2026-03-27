import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://placementchat.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/feed"],
        disallow: ["/profile", "/onboarding", "/api/", "/admin/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
