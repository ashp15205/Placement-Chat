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

  // Fetch posts
  let query = supabase.from("community_posts").select("*");

  if (sanitizedSearch) {
    // Use ilike on title and content separately then combine with .or()
    // Escape percent signs in the query to be safe
    const escaped = sanitizedSearch.replace(/%/g, "\\%");
    query = query.or(
      `title.ilike.%${escaped}%,content.ilike.%${escaped}%`
    );
  }

  const orderCol = sort === "popular" ? "likes_count" : "created_at";
  const { data: posts, error } = await query
    .order(orderCol, { ascending: false })
    .range(from, to);

  if (error) {
    // If there's a search active and it causes a parse error, return empty results
    // so users see "no threads found" instead of a raw error message
    if (search) {
      return NextResponse.json({ ok: true, posts: [] });
    }
    return NextResponse.json({ ok: false, message: "Could not load community." }, { status: 500 });
  }

  // Collect unique non-anonymous user_ids to fetch profiles
  const userIds = [
    ...new Set(
      (posts || [])
        .filter((p) => !p.is_anonymous)
        .map((p) => p.user_id)
    ),
  ];

  let profileMap: Record<string, { full_name: string | null; college_name: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, display_name, college_name")
      .in("user_id", userIds);

    if (profiles) {
      for (const p of profiles) {
        profileMap[p.user_id] = {
          full_name: p.full_name || p.display_name || null,
          college_name: p.college_name || null,
        };
      }
    }
  }

  // Merge author info, stripping identity for anonymous posts
  const enriched = (posts || []).map((post) => {
    if (post.is_anonymous) {
      return {
        ...post,
        user_id: "anonymous",
        author_name: null,
        author_college: null,
      };
    }
    const profile = profileMap[post.user_id];
    return {
      ...post,
      author_name: profile?.full_name || null,
      author_college: profile?.college_name || null,
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
