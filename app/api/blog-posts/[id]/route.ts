import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

// GET - Fetch single blog post
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: post, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("[v0] Error fetching blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("[v0] Error in GET /api/blog-posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update blog post (super admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden - Super admin only" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      featured_image_url: body.featured_image_url,
      tags: body.tags || [],
      seo_title: body.seo_title,
      seo_description: body.seo_description,
    }

    // Handle publish status change
    if (body.is_published !== undefined) {
      updateData.is_published = body.is_published
      if (body.is_published && !body.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: post, error } = await supabase.from("blog_posts").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("[v0] Error in PUT /api/blog-posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete blog post (super admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden - Super admin only" }, { status: 403 })
    }

    const { id } = await params

    const { error } = await supabase.from("blog_posts").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting blog post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/blog-posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
