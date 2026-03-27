import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ExperienceDetailClient from "./detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  const supabase = await createClient();
  const { data: exp } = await supabase
    .from("experiences")
    .select("company_name, role_name, author_name")
    .eq("id", id)
    .maybeSingle();

  if (!exp) return { title: "Experience Detail" };

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${exp.company_name} ${exp.role_name} Interview Experience`,
    description: `Read the interview experience of ${exp.author_name || "a user"} at ${exp.company_name} for the ${exp.role_name} role. Rounds breakdown and questions included.`,
    openGraph: {
      title: `${exp.company_name} Interview Experience`,
      description: `Full breakdown of rounds and questions for ${exp.role_name} at ${exp.company_name}.`,
      images: [...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: `${exp.company_name} Interview Experience`,
      description: `Verified interview insights for ${exp.role_name}.`,
    }
  };
}

export default function Page() {
  return <ExperienceDetailClient />;
}
