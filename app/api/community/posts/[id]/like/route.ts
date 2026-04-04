import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in to like." }, { status: 401 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("community_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from("community_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) {
      return NextResponse.json({ ok: false, message: "Could not unlike." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, liked: false });
  } else {
    // Like
    const { error } = await supabase
      .from("community_likes")
      .insert({ user_id: user.id, post_id: postId });

    if (error) {
      return NextResponse.json({ ok: false, message: "Could not like." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, liked: true });
  }
}
