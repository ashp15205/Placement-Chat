import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/community/posts/[id] — single post + comments
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the post
  const { data: post, error: postError } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ ok: false, message: "Post not found." }, { status: 404 });
  }

  // Fetch all comments for this post (includes replies)
  const { data: comments } = await supabase
    .from("community_comments")
    .select("id, post_id, user_id, content, is_anonymous, parent_comment_id, likes_count, created_at")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  // Collect user_ids for profile resolution
  const allUserIds = new Set<string>();
  if (!post.is_anonymous) allUserIds.add(post.user_id);
  for (const c of comments || []) {
    if (!c.is_anonymous) allUserIds.add(c.user_id);
  }

  let profileMap: Record<string, { full_name: string | null; college_name: string | null }> = {};
  const userIdArr = [...allUserIds];
  if (userIdArr.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, display_name, college_name")
      .in("user_id", userIdArr);

    if (profiles) {
      for (const p of profiles) {
        profileMap[p.user_id] = {
          full_name: p.full_name || p.display_name || null,
          college_name: p.college_name || null,
        };
      }
    }
  }

  // Enrich post
  const enrichedPost = post.is_anonymous
    ? { ...post, user_id: "anonymous", author_name: null, author_college: null }
    : {
        ...post,
        author_name: profileMap[post.user_id]?.full_name || null,
        author_college: profileMap[post.user_id]?.college_name || null,
      };

  // Enrich comments
  const enrichedComments = (comments || []).map((c) => {
    if (c.is_anonymous) {
      return { ...c, user_id: "anonymous", author_name: null };
    }
    return {
      ...c,
      author_name: profileMap[c.user_id]?.full_name || null,
    };
  });

  return NextResponse.json({ ok: true, post: enrichedPost, comments: enrichedComments });
}
