import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/community/comments/[id]/like — toggle like on a comment
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in to like." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("community_comment_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_comment_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);
    if (error) return NextResponse.json({ ok: false, message: "Could not unlike." }, { status: 500 });
    return NextResponse.json({ ok: true, liked: false });
  } else {
    const { error } = await supabase
      .from("community_comment_likes")
      .insert({ user_id: user.id, comment_id: commentId });
    if (error) return NextResponse.json({ ok: false, message: "Could not like." }, { status: 500 });
    return NextResponse.json({ ok: true, liked: true });
  }
}
