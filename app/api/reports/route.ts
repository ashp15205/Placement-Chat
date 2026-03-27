import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReportPayload = {
  experienceId?: string;
  message?: string;
};

export async function POST(request: Request) {
  let payload: ReportPayload;

  try {
    payload = (await request.json()) as ReportPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const experienceId = payload.experienceId?.trim();
  const message = payload.message?.trim();

  if (!experienceId || !message) {
    return NextResponse.json({ ok: false, message: "Experience and reason are required." }, { status: 400 });
  }

  if (message.length < 5 || message.length > 1000) {
    return NextResponse.json(
      { ok: false, message: "Report reason must be between 5 and 1000 characters." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Please sign in to report content." }, { status: 401 });
  }

  const { data: existing, error: expError } = await supabase
    .from("experiences")
    .select("id")
    .eq("id", experienceId)
    .maybeSingle();

  if (expError || !existing) {
    return NextResponse.json({ ok: false, message: "Experience not found." }, { status: 404 });
  }

  const { error } = await supabase.from("reports").insert({
    user_id: user.id,
    experience_id: experienceId,
    reason: message,
  });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
