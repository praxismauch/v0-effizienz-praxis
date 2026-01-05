"use client"

import { useEffect, useState, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import LandingPageHeader from "@/components/landing-page-header"
import LandingPageFooter from "@/components/landing-page-footer"
import { UserContext } from "@/contexts/user-context"
import BlogPostEditor from "@/components/blog-post-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  author_name: string
  published_at: string
  is_published: boolean
  tags: string[]
}

const useSafeUser = () => {
  const context = useContext(UserContext)
  // If context is undefined (no provider), return safe defaults
  if (!context) {
    return { isSuperAdmin: false, currentUser: null, isAdmin: false }
  }
  return context
}

export default function BlogPageClient() {
  const { isSuperAdmin } = useSafeUser()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/blog-posts")
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching blog posts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleCreatePost = () => {
    setEditingPost(null)
    setEditorOpen(true)
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setEditorOpen(true)
  }

  const handleDeletePost = async (id: string) => {
    try {
      const response = await fetch(`/api/blog-posts/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error("Error deleting blog post:", error)
    } finally {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const response = await fetch(`/api/blog-posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, is_published: !post.is_published }),
      })
      if (response.ok) {
        fetchPosts()
      }
    } catch (error) {
      console.error("Error toggling publish status:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingPageHeader />

      {/* Hero */}
      <section className="container py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Zurück zur Startseite
          </Link>

          <div className="text-center space-y-6">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Blog</div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
              Insights & Best Practices
            </h1>
            <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
              Tipps, Neuigkeiten und Wissenswertes rund um modernes Praxismanagement.
            </p>
            {isSuperAdmin && (
              <Button onClick={handleCreatePost} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Post
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="container pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          {loading ? (
            <p className="text-center text-muted-foreground">Lade Blog-Posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground">Keine Blog-Posts vorhanden.</p>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className={`rounded-2xl border bg-background p-8 hover:shadow-lg transition-shadow group ${
                  !post.is_published && isSuperAdmin ? "border-orange-300 bg-orange-50/50" : ""
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary w-fit">
                      {post.category}
                    </div>
                    {!post.is_published && isSuperAdmin && (
                      <div className="inline-block rounded-lg bg-orange-500/10 px-3 py-1 text-sm text-orange-600">
                        Entwurf
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.published_at)}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
                <p className="text-muted-foreground mb-6">{post.excerpt}</p>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" className="group/btn">
                    Weiterlesen
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(post)}
                        title={post.is_published ? "Unveröffentlichen" : "Veröffentlichen"}
                      >
                        {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditPost(post)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPostToDelete(post.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <BlogPostEditor post={editingPost} open={editorOpen} onOpenChange={setEditorOpen} onSave={fetchPosts} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blog-Post löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Blog-Post wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => postToDelete && handleDeletePost(postToDelete)}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LandingPageFooter />
    </div>
  )
}
