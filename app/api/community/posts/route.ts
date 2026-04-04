import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("q") || "";
  const pageSize = 15;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // Sanitize search: strip characters that could break Supabase's filter parser (commas, parens, etc.)
  const sanitizedSearch = search.replace(/[(),]/g, " ").trim();

  // Fetch posts with author profiles joined for broad search
  // Note: we use profiles!inner() if we want to filter by them, but we want to allow all posts
  // So we'll use a slightly more complex query approach for the search.
  let query = supabase.from("community_posts").select(`
    *,
    profiles (
      full_name,
      display_name,
      college_name
    )
  `);

  if (sanitizedSearch) {
    const escaped = sanitizedSearch.replace(/%/g, "\\%");
    // Search in title, content, and the joined profile fields
    query = query.or(
      `title.ilike.%${escaped}%,content.ilike.%${escaped}%,profiles.college_name.ilike.%${escaped}%,profiles.full_name.ilike.%${escaped}%`
    );
  }

  const orderCol = sort === "popular" ? "likes_count" : "created_at";
  const { data: posts, error } = await query
    .order(orderCol, { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Community query error:", error);
    if (search) return NextResponse.json({ ok: true, posts: [] });
    return NextResponse.json({ ok: false, message: "Could not load community." }, { status: 500 });
  }

  // Merge author info, stripping identity for anonymous posts
  const enriched = (posts || []).map((post: any) => {
    const profile = post.profiles;
    if (post.is_anonymous) {
      return {
        ...post,
        user_id: "anonymous",
        author_name: null,
        author_college: null,
        profiles: undefined // strip local profile object
      };
    }
    return {
      ...post,
      author_name: profile?.full_name || profile?.display_name || null,
      author_college: profile?.college_name || null,
      profiles: undefined // strip local profile object
    };
  });

  return NextResponse.json({ ok: true, posts: enriched });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Sign in to post." }, { status: 401 });
  }

  let body: { title?: string; content?: string; is_anonymous?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const title = (body.title || "").trim();
  const content = (body.content || "").trim();
  const is_anonymous = !!body.is_anonymous;

  if (title.length < 3 || title.length > 300) {
    return NextResponse.json({ ok: false, message: "Title must be 3-300 characters." }, { status: 400 });
  }
  if (content.length < 10 || content.length > 5000) {
    return NextResponse.json({ ok: false, message: "Content must be 10-5000 characters." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: user.id,
      title,
      content,
      is_anonymous,
    })
    .select()
    .single();

  if (error) {
    const msg = error.message.includes("Rate limit") || error.message.includes("Daily limit")
      ? error.message
      : "Could not create post.";
    return NextResponse.json({ ok: false, message: msg }, { status: 429 });
  }

  return NextResponse.json({ ok: true, post: data });
}
