import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in to report." }, { status: 401 });
  }

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const reason = (body.reason || "").trim();
  if (reason.length < 5 || reason.length > 1000) {
    return NextResponse.json({ ok: false, message: "Reason must be 5-1000 characters." }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_comment_reports")
    .insert({ user_id: user.id, comment_id: commentId, reason });

  if (error) {
    const isDuplicate =
      (error as { code?: string }).code === "23505" ||
      error.message?.toLowerCase().includes("duplicate");
    if (isDuplicate) {
      return NextResponse.json({ ok: false, message: "You already reported this comment." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, message: "Could not submit report." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
