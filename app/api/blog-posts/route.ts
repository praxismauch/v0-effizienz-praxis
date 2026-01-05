import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// GET - Fetch all blog posts (published for public, all for super admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase.from("blog_posts").select("*").order("published_at", { ascending: false })

    if (user) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        query = query.eq("is_published", true)
      }
    } else {
      query = query.eq("is_published", true)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("[v0] Error fetching blog posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error("[v0] Error in GET /api/blog-posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new blog post (super admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role, name").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden - Super admin only" }, { status: 403 })
    }

    const body = await request.json()

    // Generate slug from title if not provided
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[äöü]/g, (match: string) => ({ ä: "ae", ö: "oe", ü: "ue" })[match] || match)
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title: body.title,
        slug,
        excerpt: body.excerpt,
        content: body.content,
        category: body.category,
        author_id: user.id,
        author_name: userData.name,
        featured_image_url: body.featured_image_url,
        is_published: body.is_published || false,
        published_at: body.is_published ? new Date().toISOString() : null,
        tags: body.tags || [],
        seo_title: body.seo_title,
        seo_description: body.seo_description,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/blog-posts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
