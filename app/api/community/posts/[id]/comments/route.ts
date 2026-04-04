import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in to comment." }, { status: 401 });
  }

  let body: { content?: string; is_anonymous?: boolean; parent_comment_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const content = (body.content || "").trim();
  const is_anonymous = !!body.is_anonymous;
  const parent_comment_id = body.parent_comment_id || null;

  if (content.length < 1 || content.length > 2000) {
    return NextResponse.json({ ok: false, message: "Comment must be 1-2000 characters." }, { status: 400 });
  }

  // Verify the post exists
  const { data: post } = await supabase
    .from("community_posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ ok: false, message: "Post not found." }, { status: 404 });
  }

  // If this is a reply, verify the parent exists and is a top-level comment (1-level max)
  if (parent_comment_id) {
    const { data: parentComment } = await supabase
      .from("community_comments")
      .select("id, parent_comment_id")
      .eq("id", parent_comment_id)
      .eq("post_id", postId)
      .single();

    if (!parentComment) {
      return NextResponse.json({ ok: false, message: "Parent comment not found." }, { status: 404 });
    }

    // Enforce 1-level only — cannot reply to a reply
    if (parentComment.parent_comment_id) {
      return NextResponse.json(
        { ok: false, message: "Cannot reply to a reply. Max 1 level of nesting." },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      is_anonymous,
      parent_comment_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: "Could not add comment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, comment: data });
}
