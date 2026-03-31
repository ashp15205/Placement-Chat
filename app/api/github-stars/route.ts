import { NextResponse } from "next/server";

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/ashp15205/Placement-Chat",
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return NextResponse.json({ stars: 0 });

    const data = await res.json();
    return NextResponse.json({ stars: data.stargazers_count ?? 0 });
  } catch (err) {
    console.error("GitHub API Route Error:", err);
    return NextResponse.json({ stars: 0 });
  }
}
