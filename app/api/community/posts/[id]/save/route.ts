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
    return NextResponse.json({ ok: false, message: "Sign in to save." }, { status: 401 });
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("community_saves")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    // Unsave
    const { error } = await supabase
      .from("community_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) {
      return NextResponse.json({ ok: false, message: "Could not unsave." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, saved: false });
  } else {
    // Save
    const { error } = await supabase
      .from("community_saves")
      .insert({ user_id: user.id, post_id: postId });

    if (error) {
      return NextResponse.json({ ok: false, message: "Could not save." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, saved: true });
  }
}
