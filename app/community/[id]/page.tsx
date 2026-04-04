import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PostDetailClient } from "./post-detail-client";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("community_posts")
    .select("title, content, is_anonymous")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    return { title: "Thread Not Found" };
  }

  return {
    title: post.title,
    description: post.content.slice(0, 160),
    openGraph: {
      title: `${post.title} — Community`,
      description: post.content.slice(0, 160),
    },
  };
}

export default function PostDetailPage() {
  return <PostDetailClient />;
}
